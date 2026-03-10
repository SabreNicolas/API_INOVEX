import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import { MoralEntityNew, ProductNew } from "@/entities";
import { AuthModule } from "../auth/auth.module";

import { MoralEntitiesController } from "./moral-entities.controller";
import { MoralEntitiesService } from "./moral-entities.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([MoralEntityNew, ProductNew])],
  controllers: [MoralEntitiesController],
  providers: [MoralEntitiesService, LoggerService],
  exports: [MoralEntitiesService],
})
export class MoralEntitiesModule {}
