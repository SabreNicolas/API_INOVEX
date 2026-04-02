import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnage, MoralEntityNew, ProductNew } from "../../../entities";
import { AuthModule } from "../../auth/auth.module";
import { ImportTonnageController } from "./import-tonnage.controller";
import { ImportTonnageService } from "./import-tonnage.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([ImportTonnage, MoralEntityNew, ProductNew]),
  ],
  controllers: [ImportTonnageController],
  providers: [ImportTonnageService, LoggerService],
  exports: [ImportTonnageService],
})
export class ImportTonnageModule {}
