import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ActionEnregistrement,
  QuartAction,
  QuartCalendrier,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartCalendrierController } from "./quart-calendrier.controller";
import { QuartCalendrierService } from "./quart-calendrier.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      QuartCalendrier,
      QuartAction,
      ActionEnregistrement,
    ]),
  ],
  controllers: [QuartCalendrierController],
  providers: [QuartCalendrierService, LoggerService],
  exports: [QuartCalendrierService],
})
export class QuartCalendrierModule {}
