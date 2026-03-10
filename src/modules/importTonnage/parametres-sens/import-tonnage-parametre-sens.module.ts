import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageParametreSens } from "../../../entities";
import { AuthModule } from "../../auth/auth.module";
import { ImportTonnageParametreSensController } from "./import-tonnage-parametre-sens.controller";
import { ImportTonnageParametreSensService } from "./import-tonnage-parametre-sens.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ImportTonnageParametreSens])],
  controllers: [ImportTonnageParametreSensController],
  providers: [ImportTonnageParametreSensService, LoggerService],
  exports: [ImportTonnageParametreSensService],
})
export class ImportTonnageParametreSensModule {}
