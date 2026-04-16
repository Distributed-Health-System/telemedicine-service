import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RtcTokenBuilder, RtcRole } from 'agora-token';
import * as jwt from 'jsonwebtoken';
import type { JoinTokenPayload } from '../../presentation/guards/join-token.guard.js';
import type { ITelemedicineRepository } from '../../domain/repositories/telemedicine.repository.interface.js';
import { TELEMEDICINE_REPOSITORY } from '../../domain/repositories/telemedicine.repository.interface.js';
import { TelemedicineSession } from '../../domain/entities/telemedicine.entity.js';
import { TelemedicineSessionNotFoundException } from '../../domain/exceptions/telemedicine-not-found.exception.js';
import { CreateSessionDto } from '../dtos/create-session.dto.js';
import { GenerateTokenDto } from '../dtos/generate-token.dto.js';

@Injectable()
export class TelemedicineService {
  constructor(
    @Inject(TELEMEDICINE_REPOSITORY)
    private readonly repo: ITelemedicineRepository,
    private readonly config: ConfigService,
  ) {}

  private buildChannelName(appointmentId: string): string {
    return `telehealth_${appointmentId}`;
  }

  async createSession(dto: CreateSessionDto): Promise<TelemedicineSession> {
    const existing = await this.repo.findByAppointmentId(dto.appointmentId);
    if (existing) {
      throw new ConflictException(
        `Session for appointment ${dto.appointmentId} already exists`,
      );
    }

    return this.repo.create({
      appointmentId: dto.appointmentId,
      channelName: this.buildChannelName(dto.appointmentId),
      doctorId: dto.doctorId,
      patientId: dto.patientId,
      status: 'pending',
    });
  }

  async getSession(appointmentId: string): Promise<TelemedicineSession> {
    const session = await this.repo.findByAppointmentId(appointmentId);
    if (!session) throw new TelemedicineSessionNotFoundException(appointmentId);
    return session;
  }

  async generateToken(
    appointmentId: string,
    dto: GenerateTokenDto,
    joinPayload: JoinTokenPayload,
  ): Promise<{ token: string; channelName: string; uid: number; appId: string; role: 'doctor' | 'patient' }> {
    const session = await this.repo.findByAppointmentId(appointmentId);
    if (!session) throw new TelemedicineSessionNotFoundException(appointmentId);

    const appId = this.config.get<string>('agora.appId')!;
    const appCertificate = this.config.get<string>('agora.appCertificate')!;
    const expirySeconds = this.config.get<number>('agora.tokenExpirySeconds')!;

    const uid = dto.uid ?? 0;

    // Role is derived from the verified joinToken — never trusted from the client body.
    // Both doctor and patient are publishers (two-way audio/video consultation).
    // The role distinction is preserved for future permission extensions (e.g. recording).
    const agoraRole = RtcRole.PUBLISHER;

    const expireTimestamp = Math.floor(Date.now() / 1000) + expirySeconds;

    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      session.channelName,
      uid,
      agoraRole,
      expireTimestamp,
      expireTimestamp,
    );

    // Mark session active on first token generation
    if (session.status === 'pending') {
      await this.repo.update(session.id, {
        status: 'active',
        startedAt: new Date(),
      });
    }

    return {
      token,
      channelName: session.channelName,
      uid,
      appId,
      role: joinPayload.role,
    };
  }

  async generateJoinLinks(
    appointmentId: string,
  ): Promise<{ doctorLink: string; patientLink: string }> {
    const session = await this.repo.findByAppointmentId(appointmentId);
    if (!session) throw new TelemedicineSessionNotFoundException(appointmentId);

    const secret = this.config.get<string>('joinToken.secret');
    if (!secret) {
      throw new InternalServerErrorException(
        'JOIN_TOKEN_SECRET is not configured.',
      );
    }

    const frontendBaseUrl =
      this.config.get<string>('frontend.baseUrl') ?? 'http://localhost:3000';

    const doctorToken = jwt.sign(
      { appointmentId, userId: session.doctorId, role: 'doctor' } satisfies JoinTokenPayload,
      secret,
    );

    const patientToken = jwt.sign(
      { appointmentId, userId: session.patientId, role: 'patient' } satisfies JoinTokenPayload,
      secret,
    );

    return {
      doctorLink: `${frontendBaseUrl}/doctor/consultations/${appointmentId}?joinToken=${doctorToken}`,
      patientLink: `${frontendBaseUrl}/patient/consultations/${appointmentId}?joinToken=${patientToken}`,
    };
  }

  async endSession(appointmentId: string): Promise<TelemedicineSession> {
    const session = await this.repo.findByAppointmentId(appointmentId);
    if (!session) throw new TelemedicineSessionNotFoundException(appointmentId);

    const updated = await this.repo.update(session.id, {
      status: 'ended',
      endedAt: new Date(),
    });

    return updated!;
  }
}
