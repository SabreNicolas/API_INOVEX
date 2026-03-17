import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement, QuartEvenementCause } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartEvenementCauseController } from "./quart-evenement-cause.controller";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";
import { QuartEvenementController } from "./quart-evenement.controller";
import { QuartEvenementService } from "./quart-evenement.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([QuartEvenement, QuartEvenementCause]),
  ],
  controllers: [QuartEvenementController, QuartEvenementCauseController],
  providers: [
    QuartEvenementService,
    QuartEvenementCauseService,
    FileUploadService,
    LoggerService,
  ],
  exports: [QuartEvenementService, QuartEvenementCauseService],
})
export class QuartEvenementModule {}
