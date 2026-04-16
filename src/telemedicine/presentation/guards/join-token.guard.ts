import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export interface JoinTokenPayload {
  appointmentId: string;
  userId: string;
  role: 'doctor' | 'patient';
}

/**
 * JoinTokenGuard — Presentation Layer Guard
 *
 * Verifies the signed `joinToken` passed in the request body when a user
 * wants to generate an Agora RTC token to join a video session.
 *
 * This guard is used INSTEAD of GatewayAuthGuard on the token generation
 * endpoint. The joinToken (issued by this service via /join-links) is the
 * sole proof of identity — no Keycloak session is required, making it
 * suitable for click-to-join links sent in notification emails.
 *
 * Verification steps:
 *  1. `joinToken` must be present in the request body.
 *  2. Signature must be valid (HMAC-SHA256, JOIN_TOKEN_SECRET).
 *  3. `appointmentId` in the token must match the `:appointmentId` URL param.
 *
 * On success, attaches the verified payload to `request.joinTokenPayload`
 * for downstream use by the controller / service.
 */
@Injectable()
export class JoinTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const body = request.body as { joinToken?: string };

    if (!body?.joinToken) {
      throw new UnauthorizedException(
        'joinToken is required to join a session.',
      );
    }

    const secret = this.config.get<string>('joinToken.secret');
    if (!secret) {
      throw new UnauthorizedException(
        'Join token secret is not configured on the server.',
      );
    }

    try {
      const payload = jwt.verify(body.joinToken, secret) as JoinTokenPayload;

      // The token's appointmentId must match the route param
      const appointmentId = request.params['appointmentId'];
      if (payload.appointmentId !== appointmentId) {
        throw new UnauthorizedException(
          'Join token does not match this session.',
        );
      }

      request['joinTokenPayload'] = payload;
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or tampered join token.');
    }
  }
}
