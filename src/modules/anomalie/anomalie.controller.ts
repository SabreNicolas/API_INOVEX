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

import {
  CurrentUser,
  RequireAdmin,
  RequireRondier,
} from "../../common/decorators";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { AnomalieService } from "./anomalie.service";
import { UpdateAnomalieDto } from "./dto";

@ApiTags("Anomalies")
@ApiCookieAuth()
@Controller("anomalies")
@UseGuards(AuthGuard)
export class AnomalieController {
  constructor(private readonly anomalieService: AnomalieService) {}

  @Get()
  @RequireRondier()
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
  @ApiResponse({ status: 200, description: "Liste des anomalies" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.anomalieService.findAll(currentUser.idUsine, pagination);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une anomalie" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'anomalie",
  })
  @ApiResponse({ status: 200, description: "Anomalie mise à jour" })
  @ApiResponse({ status: 404, description: "Anomalie non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateAnomalieDto
  ) {
    await this.anomalieService.update(id, updateDto);
    return { message: "Anomalie mise à jour avec succès" };
  }
}
