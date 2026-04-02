import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageParametre } from "../../../entities";
import { AuthModule } from "../../auth/auth.module";
import { ImportTonnageParametreController } from "./import-tonnage-parametre.controller";
import { ImportTonnageParametreService } from "./import-tonnage-parametre.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ImportTonnageParametre])],
  controllers: [ImportTonnageParametreController],
  providers: [ImportTonnageParametreService, LoggerService],
  exports: [ImportTonnageParametreService],
})
export class ImportTonnageParametreModule {}
