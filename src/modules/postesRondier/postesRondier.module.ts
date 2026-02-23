import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { PostesRondierController } from "./postesRondier.controller";
import { PostesRondierService } from "./postesRondier.service";

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([User])],
  controllers: [PostesRondierController],
  providers: [PostesRondierService, LoggerService],
  exports: [PostesRondierService],
})
export class PostesRondierModule {}
