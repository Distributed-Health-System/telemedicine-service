import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelemedicineDocument = HydratedDocument<TelemedicineSchemaClass>;

@Schema({ collection: 'telemedicine_sessions', timestamps: true })
export class TelemedicineSchemaClass {
  @Prop({ required: true, unique: true })
  appointmentId!: string;

  @Prop({ required: true })
  channelName!: string;

  @Prop({ required: true })
  doctorId!: string;

  @Prop({ required: true })
  patientId!: string;

  @Prop({ default: 'pending' })
  status!: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  endedAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export const TelemedicineSchema = SchemaFactory.createForClass(TelemedicineSchemaClass);
