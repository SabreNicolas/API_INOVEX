import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ImportTonnage,
  ImportTonnageReactif,
  ImportTonnageSortant,
  MeasureNew,
  MoralEntityNew,
  ProductNew,
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
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, LoggerService],
  exports: [ProductsService],
})
export class ProductsModule {}
