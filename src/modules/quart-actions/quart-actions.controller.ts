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

import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiOkArrayResponseWrapped,
  ApiPaginatedResponseWrapped,
  RequireRondier,
} from "../../common/decorators";
import { ActionEnregistrement, QuartAction } from "../../entities";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import {
  CreateActionEnregistrementDto,
  CreateQuartActionDto,
  UpdateActionEnregistrementDto,
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
  @ApiOkArrayResponseWrapped(ActionEnregistrement)
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
  @ApiPaginatedResponseWrapped(QuartAction)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.findAll(currentUser.idUsine, pagination);
  }

  @Post()
  @RequireRondier()
  @ApiOperation({ summary: "Créer une action" })
  @ApiCreatedResponseWrapped(QuartAction)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartActionDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartActionsService.create(currentUser.idUsine, createDto);
  }

  // --- Actions Enregistrement ---

  @Post("enregistrements")
  @RequireRondier()
  @ApiOperation({ summary: "Créer une action enregistrement" })
  @ApiCreatedResponseWrapped(ActionEnregistrement)
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
  @ApiMessageResponseWrapped()
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
  @ApiMessageResponseWrapped()
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
