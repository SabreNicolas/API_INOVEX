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
  ApiOkResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireRole,
} from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import { MeasureNew, ProductCategorieNew, ProductNew } from "@/entities";

import {
  CreateMeasureDto,
  CreateMeasuresBatchDto,
  CreateProductAllSitesDto,
  CreateProductDto,
  UpdateMeasureDto,
  UpdateProductDto,
} from "./dto";
import { ProductsService } from "./products.service";

@ApiTags("Produits")
@ApiCookieAuth()
@Controller("products")
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN])
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
  @ApiPaginatedResponseWrapped(ProductNew)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findAll(pagination, currentUser.idUsine);
  }

  @Get("arrets")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les produits arrêts (typeId=4, enabled=1, exclut 'temps')",
  })
  @ApiOkArrayResponseWrapped(ProductNew)
  async findArrets(@CurrentUser() currentUser: RequestUser) {
    return this.productsService.findArrets(currentUser.idUsine);
  }

  @Get("types")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer tous les types de produits",
  })
  @ApiOkArrayResponseWrapped(ProductCategorieNew)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllTypes() {
    return this.productsService.findAllTypes();
  }

  @Get("sortants")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
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
  @ApiPaginatedResponseWrapped(ProductNew)
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

  @Get("typeDechets")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer tous les produits correspondants à des types de déchets",
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
  @ApiPaginatedResponseWrapped(ProductNew)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllTypeDechets(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findByType(1, pagination, currentUser.idUsine);
  }

  @Get("reactifs")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
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
  @ApiPaginatedResponseWrapped(ProductNew)
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

  @Get("entrants/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les moral entities avec leurs mesures et produits entre deux dates",
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
    description: "Moral entities avec mesures et produits",
  })
  async findEntrantsWithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findMoralEntitiesWithMeasures(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Get("sortants/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les produits sortants (typeId=5) avec mesures entre deux dates",
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
  @ApiResponse({ status: 200, description: "Produits sortants avec mesures" })
  async findSortantsWithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findByTypeWithMeasures(
      5,
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Get("reactifs-livraison/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les produits réactifs et livraison (typeId=7) avec mesures entre deux dates",
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
    description: "Produits réactifs/livraison avec mesures",
  })
  async findReactifsLivraisonWithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findByNameWithMeasures(
      "LIVRAISON",
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Get("compteurs/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les produits compteur (typeId=4) avec mesures entre deux dates",
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
  @ApiResponse({ status: 200, description: "Produits compteurs avec mesures" })
  async findCompteursWithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findCompteursWithMeasures(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Get("analyses/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Récupérer les produits analyses (typeId=6) avec mesures entre deux dates",
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
  @ApiResponse({ status: 200, description: "Produits analyses avec mesures" })
  async findAnalysesWithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findAnalysesWithMeasures(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Get("consommables/measures")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer les produits typeId=2 avec mesures entre deux dates",
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
  @ApiResponse({ status: 200, description: "Produits type 2 avec mesures" })
  async findType2WithMeasures(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.findConsommablesWithMeasures(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Post("measures")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({
    summary: "Créer une nouvelle mesure",
  })
  @ApiCreatedResponseWrapped(MeasureNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createMeasure(@Body() createDto: CreateMeasureDto) {
    return this.productsService.createMeasure(createDto);
  }

  @Post("measures-batch")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer plusieurs mesures en batch",
  })
  @ApiCreatedResponseWrapped(MeasureNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createMeasuresBatch(@Body() batchDto: CreateMeasuresBatchDto) {
    return this.productsService.createMeasuresBatch(batchDto);
  }

  @Delete("measures/entrants")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer les mesures entrants entre deux dates",
  })
  @ApiQuery({
    name: "startDate",
    type: String,
    description: "Date de début (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "endDate",
    type: String,
    description: "Date de fin (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "deleteAll",
    type: Boolean,
    description:
      "Si true, supprime toutes les mesures avec ProducerId != 0 ou != null",
    required: false,
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async deleteMeasuresEntrants(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("deleteAll") deleteAll: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.deleteMeasuresEntrants(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine,
      deleteAll === "true"
    );
  }

  @Delete("measures/sortants")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer les mesures sortants entre deux dates",
  })
  @ApiQuery({
    name: "startDate",
    type: String,
    description: "Date de début (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "endDate",
    type: String,
    description: "Date de fin (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "deleteAll",
    type: Boolean,
    description:
      "Si true, supprime toutes les mesures de produits avec Enabled=1 et typeId=5",
    required: false,
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async deleteMeasuresSortants(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("deleteAll") deleteAll: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.deleteMeasuresSortants(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine,
      deleteAll === "true"
    );
  }

  @Delete("measures/reactifs")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer les mesures réactifs entre deux dates",
  })
  @ApiQuery({
    name: "startDate",
    type: String,
    description: "Date de début (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "endDate",
    type: String,
    description: "Date de fin (YYYY-MM-DD)",
    required: true,
  })
  @ApiQuery({
    name: "deleteAll",
    type: Boolean,
    description:
      "Si true, supprime toutes les mesures de produits avec Enabled=1 et Name LIKE '%livraison%'",
    required: false,
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async deleteMeasuresReactifs(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("deleteAll") deleteAll: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.deleteMeasuresReactifs(
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine,
      deleteAll === "true"
    );
  }

  @Patch("measures/:id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({
    summary: "Mettre à jour une mesure",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la mesure",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Mesure non trouvée" })
  async updateMeasure(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateMeasureDto
  ) {
    return this.productsService.updateMeasure(id, updateDto);
  }

  @Get("categories/compteurs")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer les catégories pour les compteurs",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findCategoriesCompteurs() {
    return this.productsService.findCategoriesCompteurs();
  }

  @Get("categories/analyses")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer les catégories pour les analyses",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findCategoriesAnalyses() {
    return this.productsService.findCategoriesAnalyses();
  }

  @Get("categories/sortants")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer les catégories pour les sortants",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findCategoriesSortants() {
    return this.productsService.findCategoriesSortants();
  }

  @Get("last-code")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer le dernier code produit pour un préfixe donné",
  })
  @ApiQuery({
    name: "codePrefix",
    required: true,
    type: String,
    description: "Préfixe du code produit",
  })
  @ApiQuery({
    name: "allSites",
    required: false,
    type: Boolean,
    description: "Chercher sur tous les sites (défaut: false)",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findLastProductCode(
    @Query("codePrefix") codePrefix: string,
    @Query("allSites") allSites: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    if (allSites === "true") {
      const code =
        await this.productsService.findLastProductCodeAllSites(codePrefix);
      return { data: code };
    }
    const code = await this.productsService.findLastProductCode(
      codePrefix,
      currentUser.idUsine
    );
    return { data: code };
  }

  @Post("create-all-sites")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary:
      "Créer un produit sur tous les sites (pour sortants, analyses, consommables)",
  })
  @ApiCreatedResponseWrapped(ProductNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createOnAllSites(@Body() createDto: CreateProductAllSitesDto) {
    const { categoryId, ...productData } = createDto;
    return this.productsService.createOnAllSites(
      productData as CreateProductDto,
      categoryId
    );
  }

  @Post("create-on-site")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer un produit sur un site spécifique (pour compteurs)",
  })
  @ApiCreatedResponseWrapped(ProductNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async createOnSite(
    @Body() body: CreateProductAllSitesDto & { idUsine: number },
    @CurrentUser() currentUser: RequestUser
  ) {
    const { categoryId, ...productData } = body;
    return this.productsService.createOnSite(
      {
        ...productData,
        idUsine: body.idUsine ?? currentUser.idUsine,
      } as CreateProductDto,
      categoryId
    );
  }

  @Get("type/:typeId")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
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
  @ApiPaginatedResponseWrapped(ProductNew)
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

  @Get(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer un produit par ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiOkResponseWrapped(ProductNew)
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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer un nouveau produit",
  })
  @ApiCreatedResponseWrapped(ProductNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async create(@Body() createDto: CreateProductDto) {
    return this.productsService.create(createDto);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Mettre à jour un produit",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiMessageResponseWrapped()
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
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Activer/désactiver un produit",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du produit",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Produit non trouvé" })
  async toggleVisibility(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.productsService.toggleVisibility(id, currentUser.idUsine);
  }
}
