import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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
import { CreateAnomalieDto, UpdateAnomalieDto } from "./dto";

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

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer une anomalie par ID" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'anomalie",
  })
  @ApiResponse({ status: 200, description: "Anomalie trouvée" })
  @ApiResponse({ status: 404, description: "Anomalie non trouvée" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.anomalieService.findOne(id);
  }

  @Post()
  @RequireRondier()
  @ApiOperation({ summary: "Créer une nouvelle anomalie" })
  @ApiResponse({ status: 201, description: "Anomalie créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateAnomalieDto) {
    return this.anomalieService.create(createDto);
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

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer une anomalie" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'anomalie",
  })
  @ApiResponse({ status: 200, description: "Anomalie supprimée" })
  @ApiResponse({ status: 404, description: "Anomalie non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.anomalieService.delete(id);
    return { message: "Anomalie supprimée avec succès" };
  }
}
