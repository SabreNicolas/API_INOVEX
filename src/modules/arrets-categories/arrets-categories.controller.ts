import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiExcludeController,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "@/common/constants";
import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  RequireRole,
} from "@/common/decorators";
import { AuthGuard } from "@/common/guards/auth.guard";
import {
  ArretArretCategorie,
  ArretCategorie,
  ArretCategorieSousCategorie,
  ArretSousCategorie,
} from "@/entities";

import { ArretsCategoriesService } from "./arrets-categories.service";
import {
  CreateArretArretCategorieDto,
  CreateArretCategorieDto,
  CreateArretCategorieSousCategorieDto,
  CreateArretSousCategorieDto,
  UpdateArretCategorieDto,
  UpdateArretSousCategorieDto,
} from "./dto";

@ApiTags("Arrêts - Catégories")
@ApiCookieAuth()
@ApiExcludeController()
@Controller("arrets-categories")
@UseGuards(AuthGuard)
export class ArretsCategoriesController {
  constructor(private readonly service: ArretsCategoriesService) {}

  // ========== Catégories ==========

  @Get("categories")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer toutes les catégories d'arrêt" })
  @ApiResponse({ status: 200, type: [ArretCategorie] })
  async findAllCategories() {
    return this.service.findAllCategories();
  }

  @Get("categories/:id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer une catégorie d'arrêt par ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ArretCategorie })
  @ApiResponse({ status: 404, description: "Catégorie non trouvée" })
  async findOneCategorie(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOneCategorie(id);
  }

  @Post("categories")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Créer une catégorie d'arrêt" })
  @ApiCreatedResponseWrapped(ArretCategorie)
  async createCategorie(@Body() dto: CreateArretCategorieDto) {
    return this.service.createCategorie(dto);
  }

  @Patch("categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Mettre à jour une catégorie d'arrêt" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Catégorie non trouvée" })
  async updateCategorie(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateArretCategorieDto
  ) {
    await this.service.updateCategorie(id, dto);
    return { message: "Catégorie mise à jour avec succès" };
  }

  @Delete("categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Supprimer une catégorie d'arrêt" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Catégorie non trouvée" })
  async deleteCategorie(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteCategorie(id);
    return { message: "Catégorie supprimée avec succès" };
  }

  // ========== Sous-Catégories ==========

  @Get("sous-categories")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer toutes les sous-catégories d'arrêt" })
  @ApiResponse({ status: 200, type: [ArretSousCategorie] })
  async findAllSousCategories() {
    return this.service.findAllSousCategories();
  }

  @Get("sous-categories/:id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer une sous-catégorie d'arrêt par ID" })
  @ApiParam({ name: "id", type: Number })
  @ApiResponse({ status: 200, type: ArretSousCategorie })
  @ApiResponse({ status: 404, description: "Sous-catégorie non trouvée" })
  async findOneSousCategorie(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOneSousCategorie(id);
  }

  @Post("sous-categories")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Créer une sous-catégorie d'arrêt" })
  @ApiCreatedResponseWrapped(ArretSousCategorie)
  async createSousCategorie(@Body() dto: CreateArretSousCategorieDto) {
    return this.service.createSousCategorie(dto);
  }

  @Patch("sous-categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Mettre à jour une sous-catégorie d'arrêt" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Sous-catégorie non trouvée" })
  async updateSousCategorie(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateArretSousCategorieDto
  ) {
    await this.service.updateSousCategorie(id, dto);
    return { message: "Sous-catégorie mise à jour avec succès" };
  }

  @Delete("sous-categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Supprimer une sous-catégorie d'arrêt" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Sous-catégorie non trouvée" })
  async deleteSousCategorie(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteSousCategorie(id);
    return { message: "Sous-catégorie supprimée avec succès" };
  }

  // ========== Liaison Produit <-> Catégorie ==========

  @Get("produit-categories")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer toutes les liaisons produit-catégorie" })
  @ApiResponse({ status: 200, type: [ArretArretCategorie] })
  async findAllArretArretCategories() {
    return this.service.findAllArretArretCategories();
  }

  @Get("produit-categories/nom/:nomContient")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({ summary: "Récupérer les catégories d'arrêt par nomContient" })
  @ApiParam({ name: "nomContient", type: String })
  @ApiResponse({ status: 200, type: [ArretArretCategorie] })
  async findArretArretCategoriesByNomContient(
    @Param("nomContient") nomContient: string
  ) {
    return this.service.findArretArretCategoriesByNomContient(nomContient);
  }

  @Post("produit-categories")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Créer une liaison produit-catégorie" })
  @ApiCreatedResponseWrapped(ArretArretCategorie)
  async createArretArretCategorie(@Body() dto: CreateArretArretCategorieDto) {
    return this.service.createArretArretCategorie(dto);
  }

  @Delete("produit-categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Supprimer une liaison produit-catégorie" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async deleteArretArretCategorie(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteArretArretCategorie(id);
    return { message: "Liaison produit-catégorie supprimée avec succès" };
  }

  // ========== Liaison Catégorie <-> Sous-Catégorie ==========

  @Get("categorie-sous-categories")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer toutes les liaisons catégorie-sous-catégorie",
  })
  @ApiResponse({ status: 200, type: [ArretCategorieSousCategorie] })
  async findAllCategorieSousCategories() {
    return this.service.findAllCategorieSousCategories();
  }

  @Get("categorie-sous-categories/categorie/:idCategorie")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer les sous-catégories d'une catégorie d'arrêt",
  })
  @ApiParam({ name: "idCategorie", type: Number })
  @ApiResponse({ status: 200, type: [ArretCategorieSousCategorie] })
  async findSousCategoriesByCategorie(
    @Param("idCategorie", ParseIntPipe) idCategorie: number
  ) {
    return this.service.findSousCategoriesByCategorie(idCategorie);
  }

  @Post("categorie-sous-categories")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Créer une liaison catégorie-sous-catégorie" })
  @ApiCreatedResponseWrapped(ArretCategorieSousCategorie)
  async createCategorieSousCategorie(
    @Body() dto: CreateArretCategorieSousCategorieDto
  ) {
    return this.service.createCategorieSousCategorie(dto);
  }

  @Delete("categorie-sous-categories/:id")
  @RequireRole([UserRole.IS_KERLAN])
  @ApiOperation({ summary: "Supprimer une liaison catégorie-sous-catégorie" })
  @ApiParam({ name: "id", type: Number })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Liaison non trouvée" })
  async deleteCategorieSousCategorie(@Param("id", ParseIntPipe) id: number) {
    await this.service.deleteCategorieSousCategorie(id);
    return {
      message: "Liaison catégorie-sous-catégorie supprimée avec succès",
    };
  }
}
