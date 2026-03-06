import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  ChoixDepassement,
  ChoixDepassementProduit,
  DepassementNew,
  DepassementProduit,
} from "@/entities";
import { AuthModule } from "../auth/auth.module";

import { DepassementsController } from "./depassements.controller";
import { DepassementsService } from "./depassements.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      DepassementNew,
      ChoixDepassement,
      ChoixDepassementProduit,
      DepassementProduit,
    ]),
  ],
  controllers: [DepassementsController],
  providers: [DepassementsService, LoggerService],
  exports: [DepassementsService],
})
export class DepassementsModule {}
