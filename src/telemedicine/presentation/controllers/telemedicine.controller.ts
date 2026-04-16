import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TelemedicineService } from '../../application/services/telemedicine.service.js';
import { CreateSessionDto } from '../../application/dtos/create-session.dto.js';
import { GenerateTokenDto } from '../../application/dtos/generate-token.dto.js';
import { GatewayAuthGuard } from '../guards/gateway-auth.guard.js';
import { JoinTokenGuard } from '../guards/join-token.guard.js';
import type { JoinTokenPayload } from '../guards/join-token.guard.js';

@Controller('telemedicine-sessions')
export class TelemedicineController {
  constructor(private readonly telemedicineService: TelemedicineService) {}

  // Create a session when an appointment is confirmed — internal (gateway auth)
  @Post()
  @UseGuards(GatewayAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateSessionDto) {
    return this.telemedicineService.createSession(dto);
  }

  // Get session by appointmentId — internal (gateway auth)
  @Get(':appointmentId')
  @UseGuards(GatewayAuthGuard)
  getSession(@Param('appointmentId') appointmentId: string) {
    return this.telemedicineService.getSession(appointmentId);
  }

  // Get signed join links for doctor and patient — internal (gateway auth)
  // Returns { doctorLink, patientLink } with joinToken embedded in each URL.
  @Get(':appointmentId/join-links')
  @UseGuards(GatewayAuthGuard)
  getJoinLinks(@Param('appointmentId') appointmentId: string) {
    return this.telemedicineService.generateJoinLinks(appointmentId);
  }

  // Generate Agora token — called by frontend before joining the call.
  // Auth: joinToken from the consultation URL (no Keycloak session required).
  // JoinTokenGuard verifies the token signature and appointmentId match,
  // then attaches the verified payload so the service can derive the role.
  @Post(':appointmentId/token')
  @UseGuards(JoinTokenGuard)
  @HttpCode(HttpStatus.OK)
  generateToken(
    @Param('appointmentId') appointmentId: string,
    @Body() dto: GenerateTokenDto,
    @Req() req: Request,
  ) {
    const joinPayload = req['joinTokenPayload'] as JoinTokenPayload;
    return this.telemedicineService.generateToken(appointmentId, dto, joinPayload);
  }

  // End the session when the call finishes — internal (gateway auth)
  @Patch(':appointmentId/end')
  @UseGuards(GatewayAuthGuard)
  endSession(@Param('appointmentId') appointmentId: string) {
    return this.telemedicineService.endSession(appointmentId);
  }
}
