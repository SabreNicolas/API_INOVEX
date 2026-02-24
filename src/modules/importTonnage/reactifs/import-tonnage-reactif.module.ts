import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageReactif } from "../../../entities";
import { AuthModule } from "../../auth/auth.module";
import { ImportTonnageReactifController } from "./import-tonnage-reactif.controller";
import { ImportTonnageReactifService } from "./import-tonnage-reactif.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ImportTonnageReactif])],
  controllers: [ImportTonnageReactifController],
  providers: [ImportTonnageReactifService, LoggerService],
  exports: [ImportTonnageReactifService],
})
export class ImportTonnageReactifModule {}
