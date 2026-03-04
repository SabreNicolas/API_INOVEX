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
import { CreateElementControleDto, UpdateElementControleDto } from "./dto";
import { ElementControleService } from "./element-controle.service";

@ApiTags("Éléments de contrôle")
@ApiCookieAuth()
@Controller("elements-controle")
@UseGuards(AuthGuard)
export class ElementControleController {
  constructor(
    private readonly elementControleService: ElementControleService
  ) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer tous les éléments de contrôle" })
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
  @ApiResponse({ status: 200, description: "Liste des éléments de contrôle" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.elementControleService.findAll(currentUser.idUsine, pagination);
  }

  @Get("zone/:zoneId")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les éléments d'une zone" })
  @ApiParam({ name: "zoneId", type: "number", description: "ID de la zone" })
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
    description: "Liste des éléments de la zone",
  })
  async findByZone(
    @Param("zoneId", ParseIntPipe) zoneId: number,
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.elementControleService.findByZone(
      zoneId,
      currentUser.idUsine,
      pagination
    );
  }

  @Get("groupement/:idGroupement")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les éléments d'un groupement" })
  @ApiParam({
    name: "idGroupement",
    type: "number",
    description: "ID du groupement",
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
    description: "Liste des éléments du groupement",
  })
  async findByGroupement(
    @Param("idGroupement", ParseIntPipe) idGroupement: number,
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.elementControleService.findByGroupement(
      idGroupement,
      currentUser.idUsine,
      pagination
    );
  }

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer un élément de contrôle par ID" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'élément" })
  @ApiResponse({ status: 200, description: "Élément de contrôle trouvé" })
  @ApiResponse({ status: 404, description: "Élément de contrôle non trouvé" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.elementControleService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouvel élément de contrôle" })
  @ApiResponse({
    status: 201,
    description: "Élément de contrôle créé avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateElementControleDto) {
    return this.elementControleService.create(createDto);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un élément de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'élément" })
  @ApiResponse({ status: 200, description: "Élément de contrôle mis à jour" })
  @ApiResponse({ status: 404, description: "Élément de contrôle non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateElementControleDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.elementControleService.update(
      id,
      updateDto,
      currentUser.idUsine
    );
    return { message: "Élément de contrôle mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un élément de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'élément" })
  @ApiResponse({ status: 200, description: "Élément de contrôle supprimé" })
  @ApiResponse({ status: 404, description: "Élément de contrôle non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.elementControleService.delete(id, currentUser.idUsine);
    return { message: "Élément de contrôle supprimé avec succès" };
  }
}
