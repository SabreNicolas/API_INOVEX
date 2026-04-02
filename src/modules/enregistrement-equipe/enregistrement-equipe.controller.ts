import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "@/common/constants";

import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiOkArrayResponseWrapped,
  CurrentUser,
  RequireRole,
} from "../../common/decorators";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { EnregistrementEquipe } from "../../entities";
import { CreateEnregistrementEquipeDto } from "./dto/create-enregistrement-equipe.dto";
import { UpdateEnregistrementEquipeDto } from "./dto/update-enregistrement-equipe.dto";
import { EnregistrementEquipeService } from "./enregistrement-equipe.service";

@ApiTags("Enregistrement Equipe")
@ApiCookieAuth()
@Controller("enregistrement-equipe")
@UseGuards(AuthGuard)
export class EnregistrementEquipeController {
  constructor(
    private readonly enregistrementEquipeService: EnregistrementEquipeService
  ) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Récupérer toutes les équipes avec leurs affectations",
  })
  @ApiOkArrayResponseWrapped(EnregistrementEquipe)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(@CurrentUser() currentUser: RequestUser) {
    return this.enregistrementEquipeService.findAll(currentUser.idUsine);
  }

  @Post()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Créer une équipe avec ses affectations",
  })
  @ApiCreatedResponseWrapped(EnregistrementEquipe)
  @ApiResponse({
    status: 400,
    description: "Données invalides ou nom déjà utilisé",
  })
  async create(
    @Body() createDto: CreateEnregistrementEquipeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.enregistrementEquipeService.create(
      createDto,
      currentUser.idUsine
    );
  }

  @Put(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary:
      "Mettre à jour une équipe et ses affectations. Les affectations absentes de la liste sont supprimées.",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateEnregistrementEquipeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.enregistrementEquipeService.update(
      id,
      updateDto,
      currentUser.idUsine
    );
    return { message: "Équipe mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Supprimer une équipe et toutes ses affectations",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.enregistrementEquipeService.delete(id);
    return { message: "Équipe et ses affectations supprimées avec succès" };
  }
}
