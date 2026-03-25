import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "@/common/constants";

import {
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireRole,
} from "../../common/decorators";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { Anomalie } from "../../entities";
import { AnomalieService } from "./anomalie.service";
import { UpdateAnomalieDto } from "./dto";

@ApiTags("Anomalies")
@ApiCookieAuth()
@Controller("anomalies")
@UseGuards(AuthGuard)
export class AnomalieController {
  constructor(private readonly anomalieService: AnomalieService) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_RONDIER,
  ])
  @ApiOperation({ summary: "Récupérer toutes les anomalies" })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page",
  })
  @ApiPaginatedResponseWrapped(Anomalie)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.anomalieService.findAll(currentUser.idUsine, pagination);
  }

  @Patch(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Mettre à jour une anomalie" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'anomalie",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Anomalie non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAnomalieDto
  ) {
    await this.anomalieService.update(id, updateDto);
    return { message: "Anomalie mise à jour avec succès" };
  }
}
