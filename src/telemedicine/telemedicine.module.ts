import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelemedicineSchemaClass, TelemedicineSchema } from './infrastructure/database/mongo/schemas/telemedicine.schema.js';
import { MongoTelemedicineRepository } from './infrastructure/database/mongo/repositories/mongo-telemedicine.repository.js';
import { TELEMEDICINE_REPOSITORY } from './domain/repositories/telemedicine.repository.interface.js';
import { TelemedicineService } from './application/services/telemedicine.service.js';
import { TelemedicineController } from './presentation/controllers/telemedicine.controller.js';
import { GatewayAuthGuard } from './presentation/guards/gateway-auth.guard.js';
import { JoinTokenGuard } from './presentation/guards/join-token.guard.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TelemedicineSchemaClass.name, schema: TelemedicineSchema },
    ]),
  ],
  controllers: [TelemedicineController],
  providers: [
    TelemedicineService,
    {
      provide: TELEMEDICINE_REPOSITORY,
      useClass: MongoTelemedicineRepository,
    },
    GatewayAuthGuard,
    JoinTokenGuard,
  ],
})
export class TelemedicineModule {}
