import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadModule } from "../../common/modules/file-upload.module";
import { LoggerService } from "../../common/services/logger.service";
import { ModeOperatoire, ZoneControle } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ModeOperatoireController } from "./mode-operatoire.controller";
import { ModeOperatoireService } from "./mode-operatoire.service";

@Module({
  imports: [
    AuthModule,
    FileUploadModule,
    TypeOrmModule.forFeature([ModeOperatoire, ZoneControle]),
  ],
  controllers: [ModeOperatoireController],
  providers: [ModeOperatoireService, LoggerService],
  exports: [ModeOperatoireService],
})
export class ModeOperatoireModule {}
