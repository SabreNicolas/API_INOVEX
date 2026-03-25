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
  RequireRole,
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DateRangeQueryDto } from "../../common/dto/date-range-query.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { QuartActualite } from "../../entities";
import {
  ActiveOnDateQueryDto,
  CreateQuartActualiteDto,
  UpdateQuartActualiteDto,
} from "./dto";
import { QuartActualiteService } from "./quart-actualite.service";

@ApiTags("Quart Actualités")
@ApiCookieAuth()
@Controller("quart-actualites")
@UseGuards(AuthGuard)
export class QuartActualiteController {
  constructor(private readonly quartActualiteService: QuartActualiteService) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer toutes les actualités" })
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
  @ApiPaginatedResponseWrapped(QuartActualite)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findAll(currentUser.idUsine, pagination);
  }

  @Get("active-on-date")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les actualités actives sur une date" })
  @ApiPaginatedResponseWrapped(QuartActualite)
  async findActiveOnDate(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findActiveOnDate(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("by-date")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les actualités par plage de dates" })
  @ApiPaginatedResponseWrapped(QuartActualite)
  async findByDateRange(
    @Query() query: DateRangeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findByDateRange(
      currentUser.idUsine,
      new Date(query.dateDebut),
      new Date(query.dateFin),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("inactive")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Récupérer les actualités inactives sur une date",
  })
  @ApiPaginatedResponseWrapped(QuartActualite)
  async findInactive(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findInactive(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("futur")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Récupérer les actualités à venir après une date",
  })
  @ApiPaginatedResponseWrapped(QuartActualite)
  async findFuture(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findFuture(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Post()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Créer une nouvelle actualité" })
  @ApiCreatedResponseWrapped(QuartActualite)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartActualiteDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Mettre à jour une actualité" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'actualité",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Actualité non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartActualiteDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActualiteService.update(id, currentUser.idUsine, updateDto);
    return { message: "Actualité mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Supprimer une actualité" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'actualité",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Actualité non trouvée" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActualiteService.delete(id, currentUser.idUsine);
    return { message: "Actualité supprimée avec succès" };
  }
}
