import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  ArretArretCategorie,
  ArretCategorie,
  ArretCategorieSousCategorie,
  ArretSousCategorie,
} from "@/entities";

import { AuthModule } from "../auth/auth.module";
import { ArretsCategoriesController } from "./arrets-categories.controller";
import { ArretsCategoriesService } from "./arrets-categories.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      ArretCategorie,
      ArretSousCategorie,
      ArretArretCategorie,
      ArretCategorieSousCategorie,
    ]),
  ],
  controllers: [ArretsCategoriesController],
  providers: [ArretsCategoriesService, LoggerService],
  exports: [ArretsCategoriesService],
})
export class ArretsCategoriesModule {}
