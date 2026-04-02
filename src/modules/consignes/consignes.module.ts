import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadModule } from "../../common/modules/file-upload.module";
import { LoggerService } from "../../common/services/logger.service";
import { Consigne, ConsigneType } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ConsignesController } from "./consignes.controller";
import { ConsignesService } from "./consignes.service";

@Module({
  imports: [
    AuthModule,
    FileUploadModule,
    TypeOrmModule.forFeature([Consigne, ConsigneType]),
  ],
  controllers: [ConsignesController],
  providers: [ConsignesService, LoggerService],
  exports: [ConsignesService],
})
export class ConsignesModule {}
