import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ConsigneType,
  Conversion,
  PosteRondier,
  QuartEvenementCause,
  Rapport,
  Site,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { AdminKerlanController } from "./admin-kerlan.controller";
import { AdminKerlanService } from "./admin-kerlan.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Site,
      ConsigneType,
      QuartEvenementCause,
      Rapport,
      PosteRondier,
      Conversion,
    ]),
  ],
  controllers: [AdminKerlanController],
  providers: [AdminKerlanService, LoggerService],
  exports: [AdminKerlanService],
})
export class AdminKerlanModule {}
