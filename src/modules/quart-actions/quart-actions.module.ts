import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ActionEnregistrement, QuartAction } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartActionsController } from "./quart-actions.controller";
import { QuartActionsService } from "./quart-actions.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([QuartAction, ActionEnregistrement]),
  ],
  controllers: [QuartActionsController],
  providers: [QuartActionsService, LoggerService],
  exports: [QuartActionsService],
})
export class QuartActionsModule {}
