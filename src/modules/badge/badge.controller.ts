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
import { Badge, User, ZoneControle } from "../../entities";
import { BadgeService } from "./badge.service";
import {
  AssignBadgeToUserDto,
  AssignBadgeToZoneDto,
  CreateBadgeDto,
} from "./dto";

@ApiTags("Badges")
@ApiCookieAuth()
@Controller("badges")
@UseGuards(AuthGuard)
export class BadgeController {
  constructor(private readonly badgeService: BadgeService) {}

  @Get("assigned-users")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Récupérer tous les badges affectés à des utilisateurs",
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
  @ApiPaginatedResponseWrapped(Badge)
  async findAllAssignedToUsers(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.badgeService.findAllAssignedToUsers(
      currentUser.idUsine,
      pagination
    );
  }

  @Get("assigned-zones")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Récupérer tous les badges affectés à des zones" })
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
  @ApiPaginatedResponseWrapped(Badge)
  async findAllAssignedToZones(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.badgeService.findAllAssignedToZones(
      currentUser.idUsine,
      pagination
    );
  }

  @Get("unassigned")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Récupérer les badges non affectés" })
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
  @ApiPaginatedResponseWrapped(Badge)
  async findUnassigned(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.badgeService.findUnassigned(currentUser.idUsine, pagination);
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Créer un nouveau badge" })
  @ApiCreatedResponseWrapped(Badge)
  @ApiResponse({ status: 400, description: "Données invalides" })
  @ApiResponse({ status: 409, description: "UID déjà existant" })
  async create(@Body() createDto: CreateBadgeDto) {
    return this.badgeService.create(createDto);
  }

  @Patch(":id/assign-user")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Affecter un badge à un utilisateur" })
  @ApiParam({ name: "id", type: "number", description: "ID du badge" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 400, description: "Badge déjà affecté à une zone" })
  @ApiResponse({ status: 404, description: "Badge non trouvé" })
  async assignToUser(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignBadgeToUserDto
  ) {
    await this.badgeService.assignToUser(id, dto);
    return { message: "Badge affecté à l'utilisateur avec succès" };
  }

  @Patch(":id/assign-zone")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Affecter un badge à une zone" })
  @ApiParam({ name: "id", type: "number", description: "ID du badge" })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 400,
    description: "Badge déjà affecté à un utilisateur",
  })
  @ApiResponse({ status: 404, description: "Badge non trouvé" })
  async assignToZone(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: AssignBadgeToZoneDto
  ) {
    await this.badgeService.assignToZone(id, dto);
    return { message: "Badge affecté à la zone avec succès" };
  }

  @Get("zones-without-badge")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Récupérer les zones non affectées à un badge" })
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
  async findZonesWithoutBadge(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.badgeService.findZonesWithoutBadge(
      currentUser.idUsine,
      pagination
    );
  }

  @Get("users-without-badge")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Récupérer les utilisateurs non affectés à un badge",
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
  @ApiPaginatedResponseWrapped(User)
  async findUsersWithoutBadge(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.badgeService.findUsersWithoutBadge(
      currentUser.idUsine,
      pagination
    );
  }

  @Patch(":id/unassign")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Retirer l'affectation d'un badge" })
  @ApiParam({ name: "id", type: "number", description: "ID du badge" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Badge non trouvé" })
  async unassign(@Param("id", ParseIntPipe) id: number) {
    await this.badgeService.unassign(id);
    return { message: "Affectation du badge retirée avec succès" };
  }

  @Patch(":id/change-status")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Désactiver ou activer un badge" })
  @ApiParam({ name: "id", type: "number", description: "ID du badge" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Badge non trouvé" })
  async disable(@Param("id", ParseIntPipe) id: number) {
    await this.badgeService.changeEnable(id);
    return { message: "Badge désactivé/activé avec succès" };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Supprimer un badge" })
  @ApiParam({ name: "id", type: "number", description: "ID du badge" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Badge non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.badgeService.delete(id);
    return { message: "Badge supprimé avec succès" };
  }
}
