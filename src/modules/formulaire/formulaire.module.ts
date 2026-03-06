import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  Formulaire,
  FormulaireAffectation,
  MeasureNew,
  ProductNew,
} from "@/entities";
import { AuthModule } from "@/modules/auth/auth.module";

import { FormulaireController } from "./formulaire.controller";
import { FormulaireService } from "./formulaire.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Formulaire,
      FormulaireAffectation,
      ProductNew,
      MeasureNew,
    ]),
  ],
  controllers: [FormulaireController],
  providers: [FormulaireService, LoggerService],
  exports: [FormulaireService],
})
export class FormulaireModule {}
