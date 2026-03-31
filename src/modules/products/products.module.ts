import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  CategorieNew,
  ImportTonnage,
  ImportTonnageReactif,
  ImportTonnageSortant,
  MeasureNew,
  MoralEntityNew,
  ProductCategorieNew,
  ProductNew,
  Site,
  TypeNew,
} from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      ProductNew,
      TypeNew,
      MeasureNew,
      MoralEntityNew,
      ImportTonnage,
      ImportTonnageSortant,
      ImportTonnageReactif,
      CategorieNew,
      ProductCategorieNew,
      Site,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, LoggerService],
  exports: [ProductsService],
})
export class ProductsModule {}
