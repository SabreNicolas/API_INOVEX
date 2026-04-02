import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  AffectationEquipe,
  Anomalie,
  Consigne,
  Equipe,
  QuartActualite,
  QuartCalendrier,
  QuartEvenement,
  Site,
  ZoneControle,
} from "@/entities";

import { AuthModule } from "../auth/auth.module";
import { RegistreQuartController } from "./registre-quart.controller";
import { RegistreQuartService } from "./registre-quart.service";
import { RegistreQuartPdfService } from "./registre-quart-pdf.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Equipe,
      AffectationEquipe,
      QuartEvenement,
      Consigne,
      QuartCalendrier,
      QuartActualite,
      Anomalie,
      Site,
      ZoneControle,
    ]),
  ],
  controllers: [RegistreQuartController],
  providers: [RegistreQuartService, RegistreQuartPdfService, LoggerService],
})
export class RegistreQuartModule {}
