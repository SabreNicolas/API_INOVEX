import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  EnregistrementAffectationEquipe,
  EnregistrementEquipe,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { EnregistrementEquipeController } from "./enregistrement-equipe.controller";
import { EnregistrementEquipeService } from "./enregistrement-equipe.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      EnregistrementEquipe,
      EnregistrementAffectationEquipe,
    ]),
  ],
  controllers: [EnregistrementEquipeController],
  providers: [EnregistrementEquipeService, LoggerService],
  exports: [EnregistrementEquipeService],
})
export class EnregistrementEquipeModule {}
