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
import { CreateQuartEvenementDto, UpdateQuartEvenementDto } from "./dto";
import { QuartEvenementService } from "./quart-evenement.service";

@ApiTags("Quart Événements")
@ApiCookieAuth()
@Controller("quart-evenements")
@UseGuards(AuthGuard)
export class QuartEvenementController {
  constructor(private readonly quartEvenementService: QuartEvenementService) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer tous les événements" })
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
  @ApiResponse({ status: 200, description: "Liste des événements" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartEvenementService.findAll(currentUser.idUsine, pagination);
  }

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer un événement par ID" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'événement",
  })
  @ApiResponse({ status: 200, description: "Événement trouvé" })
  @ApiResponse({ status: 404, description: "Événement non trouvé" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartEvenementService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouvel événement" })
  @ApiResponse({ status: 201, description: "Événement créé avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateQuartEvenementDto) {
    return this.quartEvenementService.create(createDto);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'événement",
  })
  @ApiResponse({ status: 200, description: "Événement mis à jour" })
  @ApiResponse({ status: 404, description: "Événement non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartEvenementDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartEvenementService.update(id, currentUser.idUsine, updateDto);
    return { message: "Événement mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer un événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'événement",
  })
  @ApiResponse({ status: 200, description: "Événement supprimé" })
  @ApiResponse({ status: 404, description: "Événement non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartEvenementService.delete(id, currentUser.idUsine);
    return { message: "Événement supprimé avec succès" };
  }
}
