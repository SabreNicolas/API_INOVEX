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

import { DepassementsService } from "./depassements.service";
import {
  CreateChoixDepassementDto,
  CreateChoixDepassementProduitDto,
  CreateDepassementNewDto,
  CreateDepassementProduitDto,
  UpdateDepassementNewDto,
} from "./dto";
import { GetDepassementsByDateDto } from "./dto/get-depassements-by-date.dto";

@ApiTags("Dépassements")
@ApiCookieAuth()
@Controller("depassements")
@UseGuards(AuthGuard)
export class DepassementsController {
  constructor(private readonly depassementsService: DepassementsService) {}

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

  @Get("choix-depassements")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer tous les choix de dépassements" })
  @ApiResponse({
    status: 200,
    description: "Liste des choix de dépassements",
  })
  async findAllChoixDepassement() {
    return this.depassementsService.findAllChoixDepassement();
  }

  @Get("choix-depassements-produits")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les choix de dépassements produits",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des choix de dépassements produits",
  })
  async findAllChoixDepassementProduit() {
    return this.depassementsService.findAllChoixDepassementProduit();
  }

  @Get("depassements-produits")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer toutes les liaisons dépassement-produit",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des liaisons dépassement-produit",
  })
  async findAllDepassementProduit() {
    return this.depassementsService.findAllDepassementProduit();
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

  @Post("choix-depassements")
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouveau choix de dépassement" })
  @ApiResponse({
    status: 201,
    description: "Choix de dépassement créé avec succès",
  })
  async createChoixDepassement(@Body() dto: CreateChoixDepassementDto) {
    return this.depassementsService.createChoixDepassement(dto);
  }

  @Delete("choix-depassements/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un choix de dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix" })
  @ApiResponse({ status: 200, description: "Choix supprimé" })
  @ApiResponse({ status: 404, description: "Choix non trouvé" })
  async deleteChoixDepassement(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteChoixDepassement(id);
    return { message: "Choix de dépassement supprimé avec succès" };
  }

  @Post("choix-depassements-produits")
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouveau choix de dépassement produit" })
  @ApiResponse({
    status: 201,
    description: "Choix de dépassement produit créé avec succès",
  })
  async createChoixDepassementProduit(
    @Body() dto: CreateChoixDepassementProduitDto
  ) {
    return this.depassementsService.createChoixDepassementProduit(dto);
  }

  @Delete("choix-depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un choix de dépassement produit" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix produit" })
  @ApiResponse({ status: 200, description: "Choix produit supprimé" })
  @ApiResponse({ status: 404, description: "Choix produit non trouvé" })
  async deleteChoixDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteChoixDepassementProduit(id);
    return { message: "Choix de dépassement produit supprimé avec succès" };
  }

  @Post("depassements-produits")
  @RequireAdmin()
  @ApiOperation({ summary: "Créer une nouvelle liaison dépassement-produit" })
  @ApiResponse({
    status: 201,
    description: "Liaison créée avec succès",
  })
  async createDepassementProduit(@Body() dto: CreateDepassementProduitDto) {
    return this.depassementsService.createDepassementProduit(dto);
  }

  @Delete("depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer une liaison dépassement-produit" })
  @ApiParam({ name: "id", type: Number, description: "ID de la liaison" })
  @ApiResponse({ status: 200, description: "Liaison supprimée" })
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async deleteDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteDepassementProduit(id);
    return { message: "Liaison dépassement-produit supprimée avec succès" };
  }
}
