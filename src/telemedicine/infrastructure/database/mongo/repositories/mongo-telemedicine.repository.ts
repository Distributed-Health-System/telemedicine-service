import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TelemedicineSchemaClass, TelemedicineDocument } from '../schemas/telemedicine.schema.js';
import { ITelemedicineRepository } from '../../../../domain/repositories/telemedicine.repository.interface.js';
import { TelemedicineSession } from '../../../../domain/entities/telemedicine.entity.js';

@Injectable()
export class MongoTelemedicineRepository implements ITelemedicineRepository {
  constructor(
    @InjectModel(TelemedicineSchemaClass.name)
    private readonly model: Model<TelemedicineDocument>,
  ) {}

  private toEntity(doc: TelemedicineDocument): TelemedicineSession {
    const entity = new TelemedicineSession();
    entity.id = (doc._id as object).toString();
    entity.appointmentId = doc.appointmentId;
    entity.channelName = doc.channelName;
    entity.doctorId = doc.doctorId;
    entity.patientId = doc.patientId;
    entity.status = doc.status as TelemedicineSession['status'];
    entity.startedAt = doc.startedAt;
    entity.endedAt = doc.endedAt;
    entity.createdAt = doc.createdAt;
    entity.updatedAt = doc.updatedAt;
    return entity;
  }

  async findByAppointmentId(appointmentId: string): Promise<TelemedicineSession | null> {
    const doc = await this.model.findOne({ appointmentId }).exec();
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: Partial<TelemedicineSession>): Promise<TelemedicineSession> {
    const created = new this.model(data);
    const saved = await created.save();
    return this.toEntity(saved);
  }

  async update(id: string, data: Partial<TelemedicineSession>): Promise<TelemedicineSession | null> {
    const doc = await this.model
      .findByIdAndUpdate(id, { $set: data }, { new: true })
      .exec();
    return doc ? this.toEntity(doc) : null;
  }
}
