import { NotFoundException } from '@nestjs/common';

export class TelemedicineSessionNotFoundException extends NotFoundException {
  constructor(appointmentId: string) {
    super(`Telemedicine session for appointment ${appointmentId} not found`);
  }
}
