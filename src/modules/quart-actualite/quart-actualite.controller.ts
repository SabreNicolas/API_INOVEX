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

import { RequireAdmin, RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
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
  @RequireRondier()
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
  @ApiResponse({ status: 200, description: "Liste des actualités" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findAll(currentUser.idUsine, pagination);
  }

  @Get("active-on-date")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actualités actives sur une date" })
  @ApiResponse({
    status: 200,
    description: "Liste des actualités actives sur la date",
  })
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
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actualités par plage de dates" })
  @ApiQuery({
    name: "dateDebut",
    required: true,
    type: String,
    description: "Date de début (format ISO)",
  })
  @ApiQuery({
    name: "dateFin",
    required: true,
    type: String,
    description: "Date de fin (format ISO)",
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
    description: "Liste des actualités dans la plage de dates",
  })
  async findByDateRange(
    @Query("dateDebut") dateDebut: string,
    @Query("dateFin") dateFin: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findByDateRange(
      currentUser.idUsine,
      new Date(dateDebut),
      new Date(dateFin),
      pagination
    );
  }

  @Get("inactive")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les actualités inactives sur une date",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des actualités inactives sur la date",
  })
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
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les actualités à venir après une date",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des actualités à venir",
  })
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

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer une actualité par ID" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'actualité",
  })
  @ApiResponse({ status: 200, description: "Actualité trouvée" })
  @ApiResponse({ status: 404, description: "Actualité non trouvée" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer une nouvelle actualité" })
  @ApiResponse({ status: 201, description: "Actualité créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartActualiteDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActualiteService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une actualité" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'actualité",
  })
  @ApiResponse({ status: 200, description: "Actualité mise à jour" })
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
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer une actualité" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'actualité",
  })
  @ApiResponse({ status: 200, description: "Actualité supprimée" })
  @ApiResponse({ status: 404, description: "Actualité non trouvée" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActualiteService.delete(id, currentUser.idUsine);
    return { message: "Actualité supprimée avec succès" };
  }
}
