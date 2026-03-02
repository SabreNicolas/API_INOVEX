import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ZoneControleController } from "./zone-controle.controller";
import { ZoneControleService } from "./zone-controle.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ZoneControle, Groupement, ElementControle]),
  ],
  controllers: [ZoneControleController],
  providers: [ZoneControleService, LoggerService],
  exports: [ZoneControleService],
})
export class ZoneControleModule {}
