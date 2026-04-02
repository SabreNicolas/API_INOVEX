import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Badge, User, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { BadgeController } from "./badge.controller";
import { BadgeService } from "./badge.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Badge, User, ZoneControle])],
  controllers: [BadgeController],
  providers: [BadgeService, LoggerService],
  exports: [BadgeService],
})
export class BadgeModule {}
