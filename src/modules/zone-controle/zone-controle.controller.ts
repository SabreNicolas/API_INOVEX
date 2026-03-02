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
import { CreateZoneControleDto, UpdateZoneControleDto } from "./dto";
import { ZoneControleService } from "./zone-controle.service";

@ApiTags("Zones de contrôle")
@ApiCookieAuth()
@Controller("zones-controle")
@UseGuards(AuthGuard)
export class ZoneControleController {
  constructor(private readonly zoneControleService: ZoneControleService) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer toutes les zones de contrôle" })
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
  @ApiResponse({ status: 200, description: "Liste des zones de contrôle" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.zoneControleService.findAll(currentUser.idUsine, pagination);
  }

  @Get("groupements")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer toutes les zones avec leurs groupements",
  })
  @ApiResponse({ status: 200, description: "Liste des zones avec groupements" })
  async findAllWithGroupements(@CurrentUser() currentUser: RequestUser) {
    return this.zoneControleService.findAllWithGroupements(currentUser.idUsine);
  }

  @Get("groupements/elements-controle")
  @RequireRondier()
  @ApiOperation({
    summary:
      "Récupérer toutes les zones avec leurs groupements et éléments de contrôle",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des zones avec groupements et éléments de contrôle",
  })
  async findAllWithGroupementsAndElements(
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.zoneControleService.findAllWithGroupementsAndElements(
      currentUser.idUsine
    );
  }

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer une zone de contrôle par ID" })
  @ApiParam({ name: "id", type: "number", description: "ID de la zone" })
  @ApiResponse({ status: 200, description: "Zone de contrôle trouvée" })
  @ApiResponse({ status: 404, description: "Zone de contrôle non trouvée" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.zoneControleService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer une nouvelle zone de contrôle" })
  @ApiResponse({
    status: 201,
    description: "Zone de contrôle créée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateZoneControleDto) {
    return this.zoneControleService.create(createDto);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une zone de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de la zone" })
  @ApiResponse({ status: 200, description: "Zone de contrôle mise à jour" })
  @ApiResponse({ status: 404, description: "Zone de contrôle non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateZoneControleDto
  ) {
    await this.zoneControleService.update(id, updateDto);
    return { message: "Zone de contrôle mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer une zone de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de la zone" })
  @ApiResponse({ status: 200, description: "Zone de contrôle supprimée" })
  @ApiResponse({ status: 404, description: "Zone de contrôle non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.zoneControleService.delete(id);
    return { message: "Zone de contrôle supprimée avec succès" };
  }
}
