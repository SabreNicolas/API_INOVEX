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

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import {
  CreateQuartCalendrierDto,
  QuartCalendrierQueryDto,
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

  @Get()
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les entrées du calendrier entre 2 dates",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des entrées du calendrier",
  })
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
  @ApiResponse({
    status: 201,
    description: "Entrées calendrier créées avec succès",
  })
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

  @Post()
  @RequireRondier()
  @ApiOperation({ summary: "Créer une entrée dans le calendrier" })
  @ApiResponse({
    status: 201,
    description: "Entrée calendrier créée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartCalendrierDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartCalendrierService.create(currentUser.idUsine, createDto);
  }

  @Patch(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Mettre à jour une entrée du calendrier" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'entrée calendrier",
  })
  @ApiResponse({ status: 200, description: "Entrée calendrier mise à jour" })
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
  @ApiResponse({ status: 200, description: "Entrée calendrier supprimée" })
  @ApiResponse({ status: 404, description: "Entrée calendrier non trouvée" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartCalendrierService.delete(id, currentUser.idUsine);
    return { message: "Entrée calendrier supprimée avec succès" };
  }
}
