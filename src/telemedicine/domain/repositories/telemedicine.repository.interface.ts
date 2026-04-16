import { TelemedicineSession } from '../entities/telemedicine.entity.js';

export const TELEMEDICINE_REPOSITORY = 'TELEMEDICINE_REPOSITORY';

export interface ITelemedicineRepository {
  findByAppointmentId(appointmentId: string): Promise<TelemedicineSession | null>;
  create(session: Partial<TelemedicineSession>): Promise<TelemedicineSession>;
  update(id: string, session: Partial<TelemedicineSession>): Promise<TelemedicineSession | null>;
}
