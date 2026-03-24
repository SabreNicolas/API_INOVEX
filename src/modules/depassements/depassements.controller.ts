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
  ApiOkArrayResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireRole,
} from "@/common/decorators";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import {
  ChoixDepassement,
  ChoixDepassementProduit,
  DepassementNew,
  DepassementProduit,
} from "@/entities";

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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer tous les choix de dépassements avec leurs produits associés",
  })
  @ApiOkArrayResponseWrapped(ChoixDepassement)
  async findChoixWithProduits() {
    return this.depassementsService.findChoixWithProduits();
  }

  @Get("total-by-date")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
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
  @ApiPaginatedResponseWrapped(DepassementNew)
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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer tous les choix de dépassements" })
  @ApiOkArrayResponseWrapped(ChoixDepassement)
  async findAllChoixDepassement() {
    return this.depassementsService.findAllChoixDepassement();
  }

  @Get("choix-depassements-produits")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer tous les choix de dépassements produits",
  })
  @ApiOkArrayResponseWrapped(ChoixDepassementProduit)
  async findAllChoixDepassementProduit() {
    return this.depassementsService.findAllChoixDepassementProduit();
  }

  @Get("depassements-produits")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer toutes les liaisons dépassement-produit",
  })
  @ApiOkArrayResponseWrapped(DepassementProduit)
  async findAllDepassementProduit() {
    return this.depassementsService.findAllDepassementProduit();
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Créer un nouveau dépassement" })
  @ApiCreatedResponseWrapped(DepassementNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateDepassementNewDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.depassementsService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Mettre à jour un dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du dépassement" })
  @ApiMessageResponseWrapped()
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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Supprimer un dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du dépassement" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Dépassement non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.depassementsService.delete(id, currentUser.idUsine);
    return { message: "Dépassement supprimé avec succès" };
  }

  @Post("choix-depassements")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Créer un nouveau choix de dépassement" })
  @ApiCreatedResponseWrapped(ChoixDepassement)
  async createChoixDepassement(@Body() dto: CreateChoixDepassementDto) {
    return this.depassementsService.createChoixDepassement(dto);
  }

  @Delete("choix-depassements/:id")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Supprimer un choix de dépassement" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Choix non trouvé" })
  async deleteChoixDepassement(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteChoixDepassement(id);
    return { message: "Choix de dépassement supprimé avec succès" };
  }

  @Post("choix-depassements-produits")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Créer un nouveau choix de dépassement produit" })
  @ApiCreatedResponseWrapped(ChoixDepassementProduit)
  async createChoixDepassementProduit(
    @Body() dto: CreateChoixDepassementProduitDto
  ) {
    return this.depassementsService.createChoixDepassementProduit(dto);
  }

  @Delete("choix-depassements-produits/:id")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Supprimer un choix de dépassement produit" })
  @ApiParam({ name: "id", type: Number, description: "ID du choix produit" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Choix produit non trouvé" })
  async deleteChoixDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteChoixDepassementProduit(id);
    return { message: "Choix de dépassement produit supprimé avec succès" };
  }

  @Post("depassements-produits")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Créer une nouvelle liaison dépassement-produit" })
  @ApiCreatedResponseWrapped(DepassementProduit)
  async createDepassementProduit(@Body() dto: CreateDepassementProduitDto) {
    return this.depassementsService.createDepassementProduit(dto);
  }

  @Delete("depassements-produits/:id")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Supprimer une liaison dépassement-produit" })
  @ApiParam({ name: "id", type: Number, description: "ID de la liaison" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async deleteDepassementProduit(@Param("id", ParseIntPipe) id: number) {
    await this.depassementsService.deleteDepassementProduit(id);
    return { message: "Liaison dépassement-produit supprimée avec succès" };
  }
}
