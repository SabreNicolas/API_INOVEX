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
import { Groupement } from "../../entities";
import { CreateGroupementDto, UpdateGroupementDto } from "./dto";
import { GroupementService } from "./groupement.service";

@ApiTags("Groupements")
@ApiCookieAuth()
@Controller("groupements")
@UseGuards(AuthGuard)
export class GroupementController {
  constructor(private readonly groupementService: GroupementService) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_CHEF_QUART, UserRole.IS_RONDIER])
  @ApiOperation({ summary: "Récupérer tous les groupements" })
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
  @ApiPaginatedResponseWrapped(Groupement)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.groupementService.findAll(currentUser.idUsine, pagination);
  }

  @Get("zone/:zoneId")
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_CHEF_QUART, UserRole.IS_RONDIER])
  @ApiOperation({ summary: "Récupérer les groupements d'une zone" })
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
  @ApiPaginatedResponseWrapped(Groupement)
  async findByZone(
    @Param("zoneId", ParseIntPipe) zoneId: number,
    @Query() pagination: PaginationDto
  ) {
    return this.groupementService.findByZone(zoneId, pagination);
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Créer un nouveau groupement" })
  @ApiCreatedResponseWrapped(Groupement)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateGroupementDto) {
    return this.groupementService.create(createDto);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Mettre à jour un groupement" })
  @ApiParam({ name: "id", type: "number", description: "ID du groupement" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Groupement non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateGroupementDto
  ) {
    await this.groupementService.update(id, updateDto);
    return { message: "Groupement mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Supprimer un groupement" })
  @ApiParam({ name: "id", type: "number", description: "ID du groupement" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Groupement non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.groupementService.delete(id);
    return { message: "Groupement supprimé avec succès" };
  }
}
