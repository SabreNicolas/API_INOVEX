import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ProductNew, TypeNew } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([ProductNew, TypeNew])],
  controllers: [ProductsController],
  providers: [ProductsService, LoggerService],
  exports: [ProductsService],
})
export class ProductsModule {}
