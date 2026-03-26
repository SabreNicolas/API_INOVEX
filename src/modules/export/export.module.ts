import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Consigne,
  ModeOperatoire,
  QuartEvenement,
  Site,
  ZoneControle,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ExportController } from "./export.controller";
import { ExportService } from "./export.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Consigne,
      QuartEvenement,
      ModeOperatoire,
      Site,
      ZoneControle,
    ]),
  ],
  controllers: [ExportController],
  providers: [ExportService, LoggerService],
  exports: [ExportService],
})
export class ExportModule {}
