import {
  Body,
  Controller,
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

import { CreateProductDto, UpdateProductDto } from "./dto";
import { ProductsService } from "./products.service";

@ApiTags("Produits")
@ApiCookieAuth()
@Controller("products")
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les produits",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page (défaut: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des produits récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findAll(pagination, currentUser.idUsine);
  }

  @Get("types")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les types de produits",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des types de produits récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllTypes() {
    return this.productsService.findAllTypes();
  }

  @Get(":id")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer un produit par ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiResponse({
    status: 200,
    description: "Produit récupéré avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Produit non trouvé" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({
    summary: "Créer un nouveau produit",
  })
  @ApiResponse({
    status: 201,
    description: "Produit créé avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async create(@Body() createDto: CreateProductDto) {
    return this.productsService.create(createDto);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({
    summary: "Mettre à jour un produit",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiResponse({
    status: 200,
    description: "Produit mis à jour avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Produit non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateProductDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.update(id, updateDto, currentUser.idUsine);
  }

  @Patch(":id/toggle-visibility")
  @RequireAdmin()
  @ApiOperation({
    summary: "Activer/désactiver un produit",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiResponse({
    status: 200,
    description: "Visibilité du produit modifiée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Produit non trouvé" })
  async toggleVisibility(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.toggleVisibility(id, currentUser.idUsine);
  }

  @Get("type/:typeId")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer les produits par type",
  })
  @ApiParam({
    name: "typeId",
    type: "number",
    description: "ID du type de produit",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page (défaut: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des produits récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findByType(
    @Param("typeId", ParseIntPipe) typeId: number,
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findByType(
      typeId,
      pagination,
      currentUser.idUsine
    );
  }

  @Get("/sortants")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les produits sortants",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page (défaut: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des produits récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllSortants(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findAllSortants(
      pagination,
      currentUser.idUsine
    );
  }

  @Get("/reactifs")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les produits réactifs",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page (défaut: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des produits récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllReactifs(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findAllReactifs(
      pagination,
      currentUser.idUsine
    );
  }
}
