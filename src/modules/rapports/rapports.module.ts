import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Rapport } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { RapportsController } from "./rapports.controller";
import { RapportsService } from "./rapports.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Rapport])],
  controllers: [RapportsController],
  providers: [RapportsService, LoggerService],
  exports: [RapportsService],
})
export class RapportsModule {}
