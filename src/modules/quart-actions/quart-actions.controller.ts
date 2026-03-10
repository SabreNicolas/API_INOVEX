import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { CreateQuartActionDto, UpdateQuartActionDto } from "./dto";
import { QuartActionsService } from "./quart-actions.service";

@ApiTags("Quart Actions")
@ApiCookieAuth()
@Controller("quart-actions")
@UseGuards(AuthGuard)
export class QuartActionsController {
  constructor(private readonly quartActionsService: QuartActionsService) {}

  @Get("enregistrement")
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
  @ApiResponse({ status: 200, description: "Liste des actions" })
  async findAll(@CurrentUser() currentUser: RequestUser) {
    return this.quartActionsService.findAll(currentUser.idUsine);
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
}
