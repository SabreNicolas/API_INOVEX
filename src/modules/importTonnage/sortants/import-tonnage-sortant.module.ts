import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageSortant } from "../../../entities";
import { AuthModule } from "../../auth/auth.module";
import { ImportTonnageSortantController } from "./import-tonnage-sortant.controller";
import { ImportTonnageSortantService } from "./import-tonnage-sortant.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ImportTonnageSortant])],
  controllers: [ImportTonnageSortantController],
  providers: [ImportTonnageSortantService, LoggerService],
  exports: [ImportTonnageSortantService],
})
export class ImportTonnageSortantModule {}
