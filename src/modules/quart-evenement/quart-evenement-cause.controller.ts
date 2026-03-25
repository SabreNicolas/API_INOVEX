import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiCookieAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { UserRole } from "@/common/constants";

import {
  ApiOkArrayResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import { QuartEvenementCause } from "../../entities";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";

@ApiTags("Quart Événement Causes")
@ApiCookieAuth()
@Controller("quart-evenement-causes")
@UseGuards(AuthGuard)
export class QuartEvenementCauseController {
  constructor(private readonly causeService: QuartEvenementCauseService) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer toutes les causes d'événements" })
  @ApiOkArrayResponseWrapped(QuartEvenementCause)
  async findAll() {
    return this.causeService.findAll();
  }
}
