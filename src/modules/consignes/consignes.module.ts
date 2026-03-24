import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { Consigne, ConsigneType, Site } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ConsignesController } from "./consignes.controller";
import { ConsignesService } from "./consignes.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([Consigne, ConsigneType, Site]),
  ],
  controllers: [ConsignesController],
  providers: [ConsignesService, LoggerService, FileUploadService],
  exports: [ConsignesService],
})
export class ConsignesModule {}
