import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ElementControleController } from "./element-controle.controller";
import { ElementControleService } from "./element-controle.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ElementControle, ZoneControle]),
  ],
  controllers: [ElementControleController],
  providers: [ElementControleService, LoggerService],
  exports: [ElementControleService],
})
export class ElementControleModule {}
