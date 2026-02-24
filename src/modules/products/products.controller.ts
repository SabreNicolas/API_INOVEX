import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, RequireAdmin } from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import { ProductsService } from "./products.service";

@ApiTags("Produits")
@ApiCookieAuth()
@Controller("products")
@UseGuards(AuthGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

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
