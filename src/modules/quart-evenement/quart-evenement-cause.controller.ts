import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  ApiOkArrayResponseWrapped,
  RequireRondier,
} from "../../common/decorators";
import { QuartEvenementCause } from "../../entities";
import { AuthGuard } from "../../common/guards/auth.guard";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";

@ApiTags("Quart Événement Causes")
@ApiCookieAuth()
@Controller("quart-evenement-causes")
@UseGuards(AuthGuard)
export class QuartEvenementCauseController {
  constructor(private readonly causeService: QuartEvenementCauseService) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer toutes les causes d'événements" })
  @ApiOkArrayResponseWrapped(QuartEvenementCause)
  async findAll() {
    return this.causeService.findAll();
  }
}
