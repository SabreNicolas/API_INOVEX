import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { Site } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { SiteController } from "./site.controller";
import { SiteService } from "./site.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Site])],
  controllers: [SiteController],
  providers: [SiteService, LoggerService],
  exports: [SiteService],
})
export class SiteModule {}
