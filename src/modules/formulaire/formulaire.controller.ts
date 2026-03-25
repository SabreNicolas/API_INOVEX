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
  ApiOkResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireRole,
} from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import { Formulaire } from "@/entities";

import { CreateFormulaireDto, UpdateFormulaireDto } from "./dto";
import { FormulaireService } from "./formulaire.service";

@ApiTags("Formulaires")
@ApiCookieAuth()
@Controller("formulaires")
@UseGuards(AuthGuard)
export class FormulaireController {
  constructor(private readonly formulaireService: FormulaireService) {}

  @Get("with-products")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({
    summary: "Récupérer tous les formulaires avec leurs produits",
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
  @ApiPaginatedResponseWrapped(Formulaire)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAllWithProducts(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.formulaireService.findAllWithProducts(
      pagination,
      currentUser.idUsine
    );
  }

  @Get(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({
    summary: "Récupérer un formulaire par ID avec ses produits",
  })
  @ApiParam({ name: "id", type: Number, description: "ID du formulaire" })
  @ApiOkResponseWrapped(Formulaire)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Formulaire non trouvé" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.formulaireService.findOne(id);
  }

  @Get(":id/products/measures")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SAISIE,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({
    summary:
      "Récupérer les produits d'un formulaire avec leurs mesures entre deux dates",
  })
  @ApiParam({ name: "id", type: Number, description: "ID du formulaire" })
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
    description: "Produits du formulaire avec mesures récupérés avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Formulaire non trouvé" })
  async findFormulaireProductsWithMeasures(
    @Param("id", ParseIntPipe) id: number,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.formulaireService.findFormulaireProductsWithMeasures(
      id,
      new Date(startDate),
      new Date(endDate),
      currentUser.idUsine
    );
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer un nouveau formulaire avec ses produits",
  })
  @ApiCreatedResponseWrapped(Formulaire)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async create(
    @Body() createFormulaireDto: CreateFormulaireDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.formulaireService.create(
      createFormulaireDto,
      currentUser.idUsine
    );
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Mettre à jour un formulaire avec ses produits",
  })
  @ApiParam({ name: "id", type: Number, description: "ID du formulaire" })
  @ApiOkResponseWrapped(Formulaire)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Formulaire non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateFormulaireDto: UpdateFormulaireDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.formulaireService.update(
      id,
      updateFormulaireDto,
      currentUser.idUsine
    );
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer un formulaire et ses affectations",
  })
  @ApiParam({ name: "id", type: Number, description: "ID du formulaire" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  @ApiResponse({ status: 404, description: "Formulaire non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.formulaireService.delete(id, currentUser.idUsine);
    return { message: "Formulaire supprimé avec succès" };
  }
}
