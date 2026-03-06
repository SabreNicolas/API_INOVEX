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
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import { DepassementsService } from "./depassements.service";
import { CreateDepassementNewDto, UpdateDepassementNewDto } from "./dto";
import { GetDepassementsByDateDto } from "./dto/get-depassements-by-date.dto";

@ApiTags("Dépassements")
@ApiCookieAuth()
@Controller("depassements")
@UseGuards(AuthGuard)
export class DepassementsController {
  constructor(private readonly depassementsService: DepassementsService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer tous les dépassements" })
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
  @ApiResponse({ status: 200, description: "Liste des dépassements" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.findAll(currentUser.idUsine, pagination);
  }

  @Get("choix")
  @RequireAdmin()
  @ApiOperation({
    summary:
      "Récupérer tous les choix de dépassements avec leurs produits associés",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des choix de dépassements avec produits",
  })
  async findChoixWithProduits() {
    return this.depassementsService.findChoixWithProduits();
  }

  @Get("total-by-date")
  @RequireAdmin()
  @ApiOperation({
    summary:
      "Récupérer les totaux des dépassements entre deux dates par type et par ligne",
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
    description: "Totaux des dépassements par type et par ligne",
  })
  async findTotalsByDateRange(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.findTotalsByDateRange(
      currentUser.idUsine,
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get("by-date")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer les dépassements entre deux dates" })
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
    description: "Liste des dépassements filtrés par date",
  })
  async findByDateRange(
    @Query() query: GetDepassementsByDateDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.findByDateRange(
      currentUser.idUsine,
      new Date(query.startDate),
      new Date(query.endDate),
      query
    );
  }

  @Get(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer un dépassement par ID" })
  @ApiParam({ name: "id", type: Number, description: "ID du dépassement" })
  @ApiResponse({ status: 200, description: "Dépassement trouvé" })
  @ApiResponse({ status: 404, description: "Dépassement non trouvé" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouveau dépassement" })
  @ApiResponse({ status: 201, description: "Dépassement créé avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateDepassementNewDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du dépassement" })
  @ApiResponse({ status: 200, description: "Dépassement mis à jour" })
  @ApiResponse({ status: 404, description: "Dépassement non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateDepassementNewDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.depassementsService.update(id, currentUser.idUsine, updateDto);
    return { message: "Dépassement mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du dépassement" })
  @ApiResponse({ status: 200, description: "Dépassement supprimé" })
  @ApiResponse({ status: 404, description: "Dépassement non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.depassementsService.delete(id, currentUser.idUsine);
    return { message: "Dépassement supprimé avec succès" };
  }
}
