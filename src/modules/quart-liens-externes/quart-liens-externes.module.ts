import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartLienExterne } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartLiensExternesController } from "./quart-liens-externes.controller";
import { QuartLiensExternesService } from "./quart-liens-externes.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([QuartLienExterne])],
  controllers: [QuartLiensExternesController],
  providers: [QuartLiensExternesService, LoggerService],
  exports: [QuartLiensExternesService],
})
export class QuartLiensExternesModule {}
