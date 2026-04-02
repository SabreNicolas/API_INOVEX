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
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ElementControle } from "../../entities";
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
  @RequireRole([UserRole.IS_ADMIN])
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
  @ApiPaginatedResponseWrapped(ElementControle)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.elementControleService.findAll(currentUser.idUsine, pagination);
  }

  @Get("zone/:zoneId")
  @RequireRole([UserRole.IS_ADMIN])
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
  @ApiPaginatedResponseWrapped(ElementControle)
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

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Créer un nouvel élément de contrôle" })
  @ApiCreatedResponseWrapped(ElementControle)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateElementControleDto) {
    return this.elementControleService.create(createDto);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Mettre à jour un élément de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'élément" })
  @ApiMessageResponseWrapped()
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
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Supprimer un élément de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'élément" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Élément de contrôle non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.elementControleService.delete(id, currentUser.idUsine);
    return { message: "Élément de contrôle supprimé avec succès" };
  }
}
