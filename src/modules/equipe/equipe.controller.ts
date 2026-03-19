import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { EquipeQueryDto } from "./dto/equipe-query.dto";
import { EquipeService } from "./equipe.service";

@ApiTags("Equipe")
@ApiCookieAuth()
@Controller("equipe")
@UseGuards(AuthGuard)
export class EquipeController {
  constructor(private readonly equipeService: EquipeService) {}

  @Get("by-date")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer l'équipe sur une date et un quart",
  })
  @ApiResponse({
    status: 200,
    description: "Équipe avec affectations et utilisateurs",
  })
  async findByDateAndQuart(
    @Query() query: EquipeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.equipeService.findByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }
}
