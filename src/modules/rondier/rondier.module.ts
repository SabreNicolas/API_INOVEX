import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Anomalie,
  ElementControle,
  Groupement,
  MesureRondier,
  QuartCalendrier,
  RepriseRonde,
  Ronde,
  ZoneControle,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ZoneControleModule } from "../zone-controle/zone-controle.module";
import { PdfGeneratorService } from "./pdf-generator.service";
import { RondeService } from "./ronde.service";
import { RondierController } from "./rondier.controller";

@Module({
  imports: [
    AuthModule,
    ZoneControleModule,
    TypeOrmModule.forFeature([
      Ronde,
      ZoneControle,
      Groupement,
      ElementControle,
      MesureRondier,
      Anomalie,
      QuartCalendrier,
      RepriseRonde,
    ]),
  ],
  controllers: [RondierController],
  providers: [PdfGeneratorService, RondeService, LoggerService],
  exports: [PdfGeneratorService, RondeService],
})
export class RondierModule {}
