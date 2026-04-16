import { IsNumber, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class GenerateTokenDto {
  /**
   * The signed join token from the consultation URL query param (?joinToken=...).
   * Verified by JoinTokenGuard before this DTO is used — the guard extracts
   * the role and userId so the service never trusts client-supplied role values.
   */
  @IsString()
  @IsNotEmpty()
  joinToken!: string;

  /**
   * Numeric Agora user ID. Use generateUID(userId) from the frontend lib
   * to derive a stable, deterministic UID from the user's identity.
   * Defaults to 0 (Agora auto-assigns) if omitted.
   */
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  uid?: number;
}
