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
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiOkArrayResponseWrapped,
  RequireRondier,
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { QuartCalendrier } from "../../entities";
import {
  CreateQuartCalendrierDto,
  QuartCalendrierQueryDto,
  QuartHorairesQueryDto,
  UpdateQuartCalendrierDto,
} from "./dto";
import { QuartCalendrierService } from "./quart-calendrier.service";

@ApiTags("Quart Calendrier")
@ApiCookieAuth()
@Controller("quart-calendrier")
@UseGuards(AuthGuard)
export class QuartCalendrierController {
  constructor(
    private readonly quartCalendrierService: QuartCalendrierService
  ) {}

  @Get("horaires")
  @RequireRondier()
  @ApiOperation({
    summary:
      "Récupérer les heures de début et de fin de quart par date et numéro de quart",
  })
  @ApiResponse({
    status: 200,
    description:
      "Liste des zones avec leurs heures de début et de fin pour ce quart",
  })
  async findHoraires(
    @Query() query: QuartHorairesQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.findHorairesByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }

  @Get("occurrences")
  @RequireRondier()
  @ApiOperation({
    summary:
      "Lister les séries d'occurrences récurrentes (zones/actions groupées)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des occurrences groupées avec leur fin de récurrence",
  })
  async findOccurrences(@CurrentUser() currentUser: RequestUser) {
    return this.quartCalendrierService.findOccurrences(currentUser.idUsine);
  }

  @Get("zones")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les zones du calendrier entre 2 dates",
  })
  @ApiOkArrayResponseWrapped(QuartCalendrier)
  async findZonesByDateRange(
    @Query() query: QuartCalendrierQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.findZonesByDateRange(
      currentUser.idUsine,
      new Date(query.startDate),
      new Date(query.endDate)
    );
  }

  @Get("actions")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les actions du calendrier entre 2 dates",
  })
  @ApiOkArrayResponseWrapped(QuartCalendrier)
  async findActionsByDateRange(
    @Query() query: QuartCalendrierQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.findActionsByDateRange(
      currentUser.idUsine,
      new Date(query.startDate),
      new Date(query.endDate)
    );
  }

  @Get()
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les entrées du calendrier entre 2 dates",
  })
  @ApiOkArrayResponseWrapped(QuartCalendrier)
  async findByDateRange(
    @Query() query: QuartCalendrierQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.findByDateRange(
      currentUser.idUsine,
      new Date(query.startDate),
      new Date(query.endDate)
    );
  }

  @Post("batch")
  @RequireRondier()
  @ApiOperation({
    summary: "Créer plusieurs entrées dans le calendrier en une fois",
  })
  @ApiCreatedResponseWrapped(QuartCalendrier)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async createBatch(
    @Body() createDtos: CreateQuartCalendrierDto[],
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.createBatch(
      currentUser.idUsine,
      createDtos
    );
  }

  @Patch(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Mettre à jour une entrée du calendrier" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'entrée calendrier",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Entrée calendrier non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartCalendrierDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartCalendrierService.update(
      id,
      currentUser.idUsine,
      updateDto
    );
    return { message: "Entrée calendrier mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Supprimer une entrée du calendrier" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'entrée calendrier",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Entrée calendrier non trouvée" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartCalendrierService.delete(id, currentUser.idUsine);
    return { message: "Entrée calendrier supprimée avec succès" };
  }
}
