import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { AffectationEquipe, Equipe } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { EquipeController } from "./equipe.controller";
import { EquipeService } from "./equipe.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Equipe, AffectationEquipe])],
  controllers: [EquipeController],
  providers: [EquipeService, LoggerService],
  exports: [EquipeService],
})
export class EquipeModule {}
