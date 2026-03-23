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

import { CurrentUser, RequireAdmin } from "@/common/decorators";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import { ArretsService } from "./arrets.service";
import { CreateArretDto, UpdateArretDto } from "./dto";
import { GetArretsByDateDto } from "./dto/get-arrets-by-date.dto";

@ApiTags("Arrêts")
@ApiCookieAuth()
@Controller("arrets")
@UseGuards(AuthGuard)
export class ArretsController {
  constructor(private readonly arretsService: ArretsService) {}

  @Get("total-by-date")
  @RequireAdmin()
  @ApiOperation({
    summary:
      "Récupérer les totaux des arrêts entre deux dates par description et par ligne",
  })
  @ApiQuery({
    name: "startDate",
    required: true,
    type: String,
    description: "Date de début (ISO 8601)",
  })
  @ApiQuery({
    name: "endDate",
    required: true,
    type: String,
    description: "Date de fin (ISO 8601)",
  })
  @ApiResponse({
    status: 200,
    description: "Totaux des arrêts par description et par ligne",
  })
  async findTotalsByDateRange(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.arretsService.findTotalsByDateRange(
      currentUser.idUsine,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get("by-date")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer les arrêts entre deux dates" })
  @ApiQuery({
    name: "startDate",
    required: true,
    type: String,
    description: "Date de début (ISO 8601)",
  })
  @ApiQuery({
    name: "endDate",
    required: true,
    type: String,
    description: "Date de fin (ISO 8601)",
  })
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
  @ApiResponse({
    status: 200,
    description: "Liste des arrêts filtrés par date",
  })
  async findByDateRange(
    @Query() query: GetArretsByDateDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.arretsService.findByDateRange(
      currentUser.idUsine,
      new Date(query.startDate),
      new Date(query.endDate),
      query
    );
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouvel arrêt" })
  @ApiResponse({ status: 201, description: "Arrêt créé avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateArretDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.arretsService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un arrêt" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'arrêt" })
  @ApiResponse({ status: 200, description: "Arrêt mis à jour" })
  @ApiResponse({ status: 404, description: "Arrêt non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateArretDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.arretsService.update(id, currentUser.idUsine, updateDto);
    return { message: "Arrêt mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un arrêt" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'arrêt" })
  @ApiResponse({ status: 200, description: "Arrêt supprimé" })
  @ApiResponse({ status: 404, description: "Arrêt non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.arretsService.delete(id, currentUser.idUsine);
    return { message: "Arrêt supprimé avec succès" };
  }
}
