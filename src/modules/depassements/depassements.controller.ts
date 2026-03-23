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
import {
  CreateChoixDepassementDto,
  CreateChoixDepassementProduitDto,
  CreateDepassementNewDto,
  CreateDepassementProduitDto,
  UpdateChoixDepassementDto,
  UpdateChoixDepassementProduitDto,
  UpdateDepassementNewDto,
  UpdateDepassementProduitDto,
} from "./dto";
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

  // ==================== CHOIX DEPASSEMENT ====================

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

  // ==================== CHOIX DEPASSEMENT PRODUIT ====================

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

  // ==================== DEPASSEMENT PRODUIT (LIAISON) ====================

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

  // ==================== DEPASSEMENT BY ID ====================

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

  // ==================== CHOIX DEPASSEMENT (by ID) ====================

  @Get("choix-depassements/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer un choix de dépassement par ID" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix" })
  @ApiResponse({ status: 200, description: "Choix de dépassement trouvé" })
  @ApiResponse({ status: 404, description: "Choix non trouvé" })
  async findOneChoixDepassement(@Param("id", ParseIntPipe) id: number) {
    return this.depassementsService.findOneChoixDepassement(id);
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

  @Patch("choix-depassements/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un choix de dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix" })
  @ApiResponse({ status: 200, description: "Choix mis à jour" })
  @ApiResponse({ status: 404, description: "Choix non trouvé" })
  async updateChoixDepassement(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateChoixDepassementDto
  ) {
    await this.depassementsService.updateChoixDepassement(id, dto);
    return { message: "Choix de dépassement mis à jour avec succès" };
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

  // ==================== CHOIX DEPASSEMENT PRODUIT (by ID) ====================

  @Get("choix-depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer un choix de dépassement produit par ID" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix produit" })
  @ApiResponse({
    status: 200,
    description: "Choix de dépassement produit trouvé",
  })
  @ApiResponse({ status: 404, description: "Choix produit non trouvé" })
  async findOneChoixDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    return this.depassementsService.findOneChoixDepassementProduit(id);
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

  @Patch("choix-depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un choix de dépassement produit" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix produit" })
  @ApiResponse({ status: 200, description: "Choix produit mis à jour" })
  @ApiResponse({ status: 404, description: "Choix produit non trouvé" })
  async updateChoixDepassementProduit(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateChoixDepassementProduitDto
  ) {
    await this.depassementsService.updateChoixDepassementProduit(id, dto);
    return { message: "Choix de dépassement produit mis à jour avec succès" };
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

  // ==================== DEPASSEMENT PRODUIT (by ID) ====================

  @Get("depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Récupérer une liaison dépassement-produit par ID" })
  @ApiParam({ name: "id", type: Number, description: "ID de la liaison" })
  @ApiResponse({ status: 200, description: "Liaison trouvée" })
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async findOneDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    return this.depassementsService.findOneDepassementProduit(id);
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

  @Patch("depassements-produits/:id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une liaison dépassement-produit" })
  @ApiParam({ name: "id", type: Number, description: "ID de la liaison" })
  @ApiResponse({ status: 200, description: "Liaison mise à jour" })
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async updateDepassementProduit(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateDepassementProduitDto
  ) {
    await this.depassementsService.updateDepassementProduit(id, dto);
    return { message: "Liaison dépassement-produit mise à jour avec succès" };
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
