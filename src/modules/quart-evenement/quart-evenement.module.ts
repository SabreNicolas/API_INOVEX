import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadModule } from "../../common/modules/file-upload.module";
import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement, QuartEvenementCause } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartEvenementController } from "./quart-evenement.controller";
import { QuartEvenementService } from "./quart-evenement.service";
import { QuartEvenementCauseController } from "./quart-evenement-cause.controller";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";

@Module({
  imports: [
    AuthModule,
    FileUploadModule,
    TypeOrmModule.forFeature([QuartEvenement, QuartEvenementCause]),
  ],
  controllers: [QuartEvenementController, QuartEvenementCauseController],
  providers: [QuartEvenementService, QuartEvenementCauseService, LoggerService],
  exports: [QuartEvenementService, QuartEvenementCauseService],
})
export class QuartEvenementModule {}
