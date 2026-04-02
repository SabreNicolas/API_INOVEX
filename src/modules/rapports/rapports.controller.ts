import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "../../common/constants";
import {
  ApiPaginatedResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { Rapport } from "../../entities";
import { RapportsService } from "./rapports.service";

@ApiTags("Rapports")
@ApiCookieAuth()
@Controller("rapports")
@UseGuards(AuthGuard)
@RequireRole([UserRole.IS_RAPPORT])
export class RapportsController {
  constructor(private readonly rapportsService: RapportsService) {}

  @Get()
  @ApiOperation({
    summary: "Récupérer les rapports de l'usine de l'utilisateur connecté",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(Rapport)
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query() pagination: PaginationDto
  ) {
    return this.rapportsService.findByUsine(user.idUsine, pagination);
  }
}
