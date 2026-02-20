import { Module } from "@nestjs/common";

import { LoggerService } from "../common/services/logger.service";
import { HealthController } from "./health.controller";

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [LoggerService],
})
export class HealthModule {}
