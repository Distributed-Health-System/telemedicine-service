export type SessionStatus = 'pending' | 'active' | 'ended';

export class TelemedicineSession {
  id!: string;
  appointmentId!: string;
  channelName!: string;
  doctorId!: string;
  patientId!: string;
  status!: SessionStatus;
  startedAt?: Date;
  endedAt?: Date;
  createdAt!: Date;
  updatedAt!: Date;
}
