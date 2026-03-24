import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement, QuartEvenementCause, Site } from "../../entities";
import { AuthModule } from "../auth/auth.module";
import { QuartEvenementController } from "./quart-evenement.controller";
import { QuartEvenementService } from "./quart-evenement.service";
import { QuartEvenementCauseController } from "./quart-evenement-cause.controller";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([QuartEvenement, QuartEvenementCause, Site]),
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
