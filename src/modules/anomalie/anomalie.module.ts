import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Anomalie } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { AnomalieController } from "./anomalie.controller";
import { AnomalieService } from "./anomalie.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Anomalie])],
  controllers: [AnomalieController],
  providers: [AnomalieService, LoggerService],
  exports: [AnomalieService],
})
export class AnomalieModule {}
