import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  CurrentUser,
  RequireAdmin,
  RequireRondier,
} from "../../common/decorators";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { CreateEquipeDto, EquipeQueryDto, UpdateEquipeDto } from "./dto";
import { EquipeService } from "./equipe.service";

@ApiTags("Equipe")
@ApiCookieAuth()
@Controller("equipe")
@UseGuards(AuthGuard)
export class EquipeController {
  constructor(private readonly equipeService: EquipeService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer toutes les équipes avec leurs affectations",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des équipes avec affectations récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(@CurrentUser() currentUser: RequestUser) {
    return this.equipeService.findAll(currentUser.idUsine);
  }

  @Get("by-date")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer l'équipe sur une date et un quart",
  })
  @ApiResponse({
    status: 200,
    description: "Équipe avec affectations et utilisateurs",
  })
  async findByDateAndQuart(
    @Query() query: EquipeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.equipeService.findByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }

  @Get(":id")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer une équipe et ses affectations par ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiResponse({
    status: 200,
    description: "Équipe et affectations récupérées avec succès",
  })
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.equipeService.findOne(id);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({
    summary: "Créer une équipe avec ses affectations",
  })
  @ApiResponse({
    status: 201,
    description: "Équipe et affectations créées avec succès",
  })
  @ApiResponse({
    status: 400,
    description: "Données invalides ou nom déjà utilisé",
  })
  async create(@Body() createDto: CreateEquipeDto) {
    return this.equipeService.create(createDto);
  }

  @Put(":id")
  @RequireAdmin()
  @ApiOperation({
    summary:
      "Mettre à jour une équipe et ses affectations. Les affectations absentes de la liste sont supprimées.",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiResponse({
    status: 200,
    description: "Équipe et affectations mises à jour avec succès",
  })
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.equipeService.update(id, updateDto, currentUser.idUsine);
    return { message: "Équipe mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({
    summary: "Supprimer une équipe et toutes ses affectations",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiResponse({
    status: 200,
    description: "Équipe et affectations supprimées avec succès",
  })
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.equipeService.delete(id);
    return { message: "Équipe et ses affectations supprimées avec succès" };
  }
}
