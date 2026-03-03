import { Module } from "@nestjs/common";

import { LoggerService } from "../../common/services/logger.service";
import { AuthModule } from "../auth/auth.module";
import { ZoneControleModule } from "../zone-controle/zone-controle.module";
import { PdfGeneratorService } from "./pdf-generator.service";
import { RondierController } from "./rondier.controller";

@Module({
  imports: [AuthModule, ZoneControleModule],
  controllers: [RondierController],
  providers: [PdfGeneratorService, LoggerService],
  exports: [PdfGeneratorService],
})
export class RondierModule {}
