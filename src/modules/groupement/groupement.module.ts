import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { GroupementController } from "./groupement.controller";
import { GroupementService } from "./groupement.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Groupement, ZoneControle, ElementControle]),
  ],
  controllers: [GroupementController],
  providers: [GroupementService, LoggerService],
  exports: [GroupementService],
})
export class GroupementModule {}
