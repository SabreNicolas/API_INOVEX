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

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import {
  ActiveOnDateQueryDto,
  CreateActionEnregistrementDto,
  CreateQuartActionDto,
  UpdateActionEnregistrementDto,
  UpdateQuartActionDto,
} from "./dto";
import { QuartActionsService } from "./quart-actions.service";

@ApiTags("Quart Actions")
@ApiCookieAuth()
@Controller("quart-actions")
@UseGuards(AuthGuard)
export class QuartActionsController {
  constructor(private readonly quartActionsService: QuartActionsService) {}

  @Get("enregistrements")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actions enregistrement du site" })
  @ApiResponse({
    status: 200,
    description: "Liste des actions enregistrement",
  })
  async findAllEnregistrements(@CurrentUser() currentUser: RequestUser) {
    return this.quartActionsService.findAllEnregistrements(currentUser.idUsine);
  }

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actions du site" })
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
  @ApiResponse({ status: 200, description: "Liste des actions" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findAll(currentUser.idUsine, pagination);
  }

  @Get("active-on-date")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actions actives sur une date" })
  @ApiResponse({
    status: 200,
    description: "Liste des actions actives sur la date",
  })
  async findActiveOnDate(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findActiveOnDate(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("by-date")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actions par plage de dates" })
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
    description: "Liste des actions dans la plage de dates",
  })
  async findByDateRange(
    @Query("dateDebut") dateDebut: string,
    @Query("dateFin") dateFin: string,
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findByDateRange(
      currentUser.idUsine,
      new Date(dateDebut),
      new Date(dateFin),
      pagination
    );
  }

  @Get("futur")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les actions à venir après une date" })
  @ApiResponse({
    status: 200,
    description: "Liste des actions à venir",
  })
  async findFuture(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findFuture(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer une action par ID" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'action",
  })
  @ApiResponse({ status: 200, description: "Action trouvée" })
  @ApiResponse({ status: 404, description: "Action non trouvée" })
  async findOne(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findOne(id, currentUser.idUsine);
  }

  @Post()
  @RequireRondier()
  @ApiOperation({ summary: "Créer une action" })
  @ApiResponse({ status: 201, description: "Action créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartActionDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.create(currentUser.idUsine, createDto);
  }

  @Patch(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Mettre à jour une action" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'action",
  })
  @ApiResponse({ status: 200, description: "Action mise à jour" })
  @ApiResponse({ status: 404, description: "Action non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartActionDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActionsService.update(id, currentUser.idUsine, updateDto);
    return { message: "Action mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Supprimer une action" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'action",
  })
  @ApiResponse({ status: 200, description: "Action supprimée" })
  @ApiResponse({ status: 404, description: "Action non trouvée" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActionsService.delete(id, currentUser.idUsine);
    return { message: "Action supprimée avec succès" };
  }

  // --- Actions Enregistrement ---

  @Post("enregistrements")
  @RequireRondier()
  @ApiOperation({ summary: "Créer une action enregistrement" })
  @ApiResponse({
    status: 201,
    description: "Action enregistrement créée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async createEnregistrement(
    @Body() createDto: CreateActionEnregistrementDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.createEnregistrement(
      currentUser.idUsine,
      createDto.nom
    );
  }

  @Patch("enregistrements/:id")
  @RequireRondier()
  @ApiOperation({ summary: "Mettre à jour une action enregistrement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'action enregistrement",
  })
  @ApiResponse({
    status: 200,
    description: "Action enregistrement mise à jour",
  })
  @ApiResponse({
    status: 404,
    description: "Action enregistrement non trouvée",
  })
  async updateEnregistrement(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateActionEnregistrementDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActionsService.updateEnregistrement(
      id,
      currentUser.idUsine,
      updateDto.nom
    );
    return { message: "Action enregistrement mise à jour avec succès" };
  }

  @Delete("enregistrements/:id")
  @RequireRondier()
  @ApiOperation({ summary: "Supprimer une action enregistrement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'action enregistrement",
  })
  @ApiResponse({
    status: 200,
    description: "Action enregistrement supprimée",
  })
  @ApiResponse({
    status: 404,
    description: "Action enregistrement non trouvée",
  })
  async deleteEnregistrement(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartActionsService.deleteEnregistrement(
      id,
      currentUser.idUsine
    );
    return { message: "Action enregistrement supprimée avec succès" };
  }
}
