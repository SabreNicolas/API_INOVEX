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

import { UserRole } from "@/common/constants";
import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireRole,
} from "@/common/decorators";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import { Arret } from "@/entities";

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
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
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
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
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
  @ApiPaginatedResponseWrapped(Arret)
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
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({ summary: "Créer un nouvel arrêt" })
  @ApiCreatedResponseWrapped(Arret)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateArretDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.arretsService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Mettre à jour un arrêt" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'arrêt" })
  @ApiMessageResponseWrapped()
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
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({ summary: "Supprimer un arrêt" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'arrêt" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Arrêt non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.arretsService.delete(id, currentUser.idUsine);
    return { message: "Arrêt supprimé avec succès" };
  }
}
