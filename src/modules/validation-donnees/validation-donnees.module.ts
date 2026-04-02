import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ValidationDonnee } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ValidationDonneesController } from "./validation-donnees.controller";
import { ValidationDonneesService } from "./validation-donnees.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ValidationDonnee])],
  controllers: [ValidationDonneesController],
  providers: [ValidationDonneesService, LoggerService],
  exports: [ValidationDonneesService],
})
export class ValidationDonneesModule {}
