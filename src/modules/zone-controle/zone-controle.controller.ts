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
  ApiPaginatedResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ZoneControle } from "../../entities";
import { CreateZoneControleDto, UpdateZoneControleDto } from "./dto";
import { ZoneControleService } from "./zone-controle.service";

@ApiTags("Zones de contrôle")
@ApiCookieAuth()
@Controller("zones-controle")
@UseGuards(AuthGuard)
export class ZoneControleController {
  constructor(private readonly zoneControleService: ZoneControleService) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
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
  @ApiPaginatedResponseWrapped(ZoneControle)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.zoneControleService.findAll(currentUser.idUsine, pagination);
  }

  @Get("groupements/elements-controle")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary:
      "Récupérer toutes les zones avec leurs groupements et éléments de contrôle",
  })
  @ApiOkArrayResponseWrapped(ZoneControle)
  async findAllWithGroupementsAndElements(
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.zoneControleService.findAllWithGroupementsAndElements(
      currentUser.idUsine
    );
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Créer une nouvelle zone de contrôle" })
  @ApiCreatedResponseWrapped(ZoneControle)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateZoneControleDto) {
    return this.zoneControleService.create(createDto);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Mettre à jour une zone de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de la zone" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Zone de contrôle non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateZoneControleDto
  ) {
    await this.zoneControleService.update(id, updateDto);
    return { message: "Zone de contrôle mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Supprimer une zone de contrôle" })
  @ApiParam({ name: "id", type: "number", description: "ID de la zone" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Zone de contrôle non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.zoneControleService.delete(id);
    return { message: "Zone de contrôle supprimée avec succès" };
  }
}
