import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import { Arret } from "@/entities";

import { AuthModule } from "../auth/auth.module";
import { ArretsController } from "./arrets.controller";
import { ArretsService } from "./arrets.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Arret])],
  controllers: [ArretsController],
  providers: [ArretsService, LoggerService],
  exports: [ArretsService],
})
export class ArretsModule {}
