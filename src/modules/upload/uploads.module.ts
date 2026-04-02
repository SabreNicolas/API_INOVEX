import { Module } from "@nestjs/common";

import { LoggerService } from "../../common/services/logger.service";
import { AuthModule } from "../auth/auth.module";
import { UploadsController } from "./uploads.controller";

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [LoggerService],
})
export class UploadsModule {}
