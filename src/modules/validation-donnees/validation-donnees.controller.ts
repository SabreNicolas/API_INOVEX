import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
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
  ApiOkArrayResponseWrapped,
  CurrentUser,
  RequireRole,
} from "../../common/decorators";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ValidationDonnee } from "../../entities";
import { CreateValidationDonneeDto } from "./dto";
import { ValidationDonneesService } from "./validation-donnees.service";

@ApiTags("Validation Données")
@ApiCookieAuth()
@Controller("validation-donnees")
@UseGuards(AuthGuard)
export class ValidationDonneesController {
  constructor(
    private readonly validationDonneesService: ValidationDonneesService
  ) {}

  @Get("annee/:annee/mois/:mois")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Récupérer les validations de données par année et mois",
  })
  @ApiParam({
    name: "annee",
    type: "string",
    description: "Année (ex: 2026)",
    example: "2026",
  })
  @ApiParam({
    name: "mois",
    type: "string",
    description: "Mois (01-12)",
    example: "03",
  })
  @ApiOkArrayResponseWrapped(ValidationDonnee)
  async findByAnneeAndMois(
    @Param("annee") annee: string,
    @Param("mois") mois: string,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.validationDonneesService.findByAnneeAndMois(
      currentUser.idUsine,
      annee,
      mois
    );
  }

  @Post()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Créer une validation de données" })
  @ApiCreatedResponseWrapped(ValidationDonnee)
  @ApiResponse({
    status: 409,
    description: "Une validation existe déjà pour ce mois/année",
  })
  async create(
    @Body() createDto: CreateValidationDonneeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.validationDonneesService.create(
      createDto,
      currentUser.idUsine,
      currentUser.id
    );
  }
}
