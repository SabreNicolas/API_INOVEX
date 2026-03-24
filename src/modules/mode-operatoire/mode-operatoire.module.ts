import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { ModeOperatoire, Site, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ModeOperatoireController } from "./mode-operatoire.controller";
import { ModeOperatoireService } from "./mode-operatoire.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ModeOperatoire, ZoneControle, Site]),
  ],
  controllers: [ModeOperatoireController],
  providers: [ModeOperatoireService, LoggerService, FileUploadService],
  exports: [ModeOperatoireService],
})
export class ModeOperatoireModule {}
