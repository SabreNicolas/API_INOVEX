import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartActualite } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartActualiteController } from "./quart-actualite.controller";
import { QuartActualiteService } from "./quart-actualite.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([QuartActualite])],
  controllers: [QuartActualiteController],
  providers: [QuartActualiteService, LoggerService],
  exports: [QuartActualiteService],
})
export class QuartActualiteModule {}
