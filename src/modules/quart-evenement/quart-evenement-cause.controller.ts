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

import { RequireAdmin, RequireRondier } from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  CreateQuartEvenementCauseDto,
  UpdateQuartEvenementCauseDto,
} from "./dto";
import { QuartEvenementCauseService } from "./quart-evenement-cause.service";

@ApiTags("Quart Événement Causes")
@ApiCookieAuth()
@Controller("quart-evenement-causes")
@UseGuards(AuthGuard)
export class QuartEvenementCauseController {
  constructor(private readonly causeService: QuartEvenementCauseService) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer toutes les causes d'événements" })
  @ApiResponse({ status: 200, description: "Liste des causes d'événements" })
  async findAll() {
    return this.causeService.findAll();
  }

  @Get(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer une cause d'événement par ID" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la cause d'événement",
  })
  @ApiResponse({ status: 200, description: "Cause d'événement trouvée" })
  @ApiResponse({ status: 404, description: "Cause d'événement non trouvée" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.causeService.findOne(id);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer une nouvelle cause d'événement" })
  @ApiResponse({
    status: 201,
    description: "Cause d'événement créée avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateQuartEvenementCauseDto) {
    return this.causeService.create(createDto);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une cause d'événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la cause d'événement",
  })
  @ApiResponse({ status: 200, description: "Cause d'événement mise à jour" })
  @ApiResponse({ status: 404, description: "Cause d'événement non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartEvenementCauseDto
  ) {
    await this.causeService.update(id, updateDto);
    return { message: "Cause d'événement mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Supprimer une cause d'événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la cause d'événement",
  })
  @ApiResponse({ status: 200, description: "Cause d'événement supprimée" })
  @ApiResponse({ status: 404, description: "Cause d'événement non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.causeService.delete(id);
    return { message: "Cause d'événement supprimée avec succès" };
  }
}
