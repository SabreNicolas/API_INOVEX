import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartEvenementController } from "./quart-evenement.controller";
import { QuartEvenementService } from "./quart-evenement.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([QuartEvenement])],
  controllers: [QuartEvenementController],
  providers: [QuartEvenementService, LoggerService],
  exports: [QuartEvenementService],
})
export class QuartEvenementModule {}
