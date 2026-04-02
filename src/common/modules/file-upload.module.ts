import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Site } from "../../entities";
import { FileUploadService } from "../services/file-upload.service";
import { LoggerService } from "../services/logger.service";

@Module({
  imports: [TypeOrmModule.forFeature([Site])],
  providers: [FileUploadService, LoggerService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
