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
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ZoneControleService } from "../zone-controle/zone-controle.service";
import {
  CreateRepriseRondeDto,
  CreateRondeDto,
  GetRondesByDateQuartDto,
  UpdateMesureRondierDto,
  UpdateRepriseRondeDto,
} from "./dto";
import { PdfGeneratorService } from "./pdf-generator.service";
import { RondeService, RondeWithDetails } from "./ronde.service";

@ApiTags("Rondier")
@ApiCookieAuth()
@Controller("rondier")
@UseGuards(AuthGuard)
export class RondierController {
  constructor(
    private readonly zoneControleService: ZoneControleService,
    private readonly pdfGeneratorService: PdfGeneratorService,
    private readonly rondeService: RondeService
  ) {}

  @Get("rondes")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer les rondes par date et quart",
    description:
      "Récupère les rondes pour une date et un quart donnés, avec les éléments de contrôle, mesures et anomalies associés pour le site de l'utilisateur connecté",
  })
  @ApiQuery({
    name: "date",
    required: true,
    type: String,
    description: "Date de la ronde (format YYYY-MM-DD)",
    example: "2026-03-23",
  })
  @ApiQuery({
    name: "quart",
    required: true,
    type: Number,
    description: "Numéro du quart (1 = matin, 2 = après-midi, 3 = nuit)",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Liste des rondes avec détails",
  })
  @ApiResponse({
    status: 400,
    description: "Paramètres invalides",
  })
  async findRondesByDateAndQuart(
    @Query() query: GetRondesByDateQuartDto,
    @CurrentUser() currentUser: RequestUser
  ): Promise<RondeWithDetails[]> {
    return this.rondeService.findByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }

  @Post("rondes")
  @RequireRondier()
  @ApiOperation({
    summary: "Créer une nouvelle ronde avec ses mesures",
    description:
      "Crée une nouvelle ronde avec toutes ses mesures rondier associées",
  })
  @ApiResponse({
    status: 201,
    description: "Ronde créée avec succès",
  })
  @ApiResponse({
    status: 400,
    description: "Données invalides",
  })
  async createRonde(
    @Body() createDto: CreateRondeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.rondeService.createRonde(
      currentUser.idUsine,
      currentUser.id,
      createDto
    );
  }

  @Get("generate-pdf-reprise")
  @RequireRondier()
  @ApiOperation({
    summary: "Générer le PDF de reprise de ronde",
    description:
      "Génère un fichier PDF contenant toutes les zones, groupements et éléments de contrôle pour une reprise de ronde",
  })
  @ApiProduces("application/pdf")
  @ApiResponse({
    status: 200,
    description: "Fichier PDF généré avec succès",
    content: {
      "application/pdf": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  async generatePdfReprise(
    @CurrentUser() currentUser: RequestUser,
    @Res() res: Response
  ) {
    const zonesWithData =
      await this.zoneControleService.findAllWithGroupementsAndElements(
        currentUser.idUsine
      );

    const pdfBuffer =
      await this.pdfGeneratorService.generateRepriseRondePdf(zonesWithData);

    const today = new Date().toISOString().split("T")[0];

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="repriseRonde_${today}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Patch("mesures/:id")
  @RequireRondier()
  @ApiOperation({
    summary: "Mettre à jour une mesure rondier",
    description: "Met à jour les valeurs d'une mesure rondier existante",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la mesure rondier",
  })
  @ApiResponse({
    status: 200,
    description: "Mesure mise à jour avec succès",
  })
  @ApiResponse({
    status: 404,
    description: "Mesure non trouvée",
  })
  async updateMesure(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateMesureRondierDto
  ) {
    return this.rondeService.updateMesure(id, updateDto);
  }

  // ==================== RepriseRonde Routes ====================

  @Get("reprises-rondes")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer toutes les reprises de ronde",
    description:
      "Récupère toutes les reprises de ronde pour le site de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des reprises de ronde",
  })
  async findAllRepriseRonde(@CurrentUser() currentUser: RequestUser) {
    return this.rondeService.findAllRepriseRonde(currentUser.idUsine);
  }

  @Get("reprises-rondes/by-date-quart")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer une reprise de ronde par date et quart",
    description:
      "Récupère une reprise de ronde pour une date et un quart donnés",
  })
  @ApiQuery({
    name: "date",
    required: true,
    type: String,
    description: "Date de la reprise (format YYYY-MM-DD)",
    example: "2026-03-23",
  })
  @ApiQuery({
    name: "quart",
    required: true,
    type: Number,
    description: "Numéro du quart (1 = matin, 2 = après-midi, 3 = nuit)",
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: "Reprise de ronde trouvée ou null",
  })
  async findRepriseRondeByDateAndQuart(
    @Query() query: GetRondesByDateQuartDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.rondeService.findRepriseRondeByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }

  @Get("reprises-rondes/:id")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer une reprise de ronde par ID",
    description: "Récupère une reprise de ronde spécifique par son ID",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la reprise de ronde",
  })
  @ApiResponse({
    status: 200,
    description: "Reprise de ronde trouvée",
  })
  @ApiResponse({
    status: 404,
    description: "Reprise de ronde non trouvée",
  })
  async findOneRepriseRonde(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.rondeService.findOneRepriseRonde(id, currentUser.idUsine);
  }

  @Post("reprises-rondes")
  @RequireRondier()
  @ApiOperation({
    summary: "Créer une nouvelle reprise de ronde",
    description:
      "Crée une nouvelle reprise de ronde pour le site de l'utilisateur connecté",
  })
  @ApiResponse({
    status: 201,
    description: "Reprise de ronde créée avec succès",
  })
  @ApiResponse({
    status: 400,
    description: "Données invalides ou reprise existante",
  })
  async createRepriseRonde(
    @Body() createDto: CreateRepriseRondeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.rondeService.createRepriseRonde(currentUser.idUsine, createDto);
  }

  @Patch("reprises-rondes/:id")
  @RequireRondier()
  @ApiOperation({
    summary: "Mettre à jour une reprise de ronde",
    description: "Met à jour le statut de terminaison d'une reprise de ronde",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la reprise de ronde",
  })
  @ApiResponse({
    status: 200,
    description: "Reprise de ronde mise à jour",
  })
  @ApiResponse({
    status: 404,
    description: "Reprise de ronde non trouvée",
  })
  async updateRepriseRonde(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateRepriseRondeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.rondeService.updateRepriseRonde(
      id,
      currentUser.idUsine,
      updateDto
    );
  }

  @Delete("reprises-rondes/:id")
  @RequireRondier()
  @ApiOperation({
    summary: "Supprimer une reprise de ronde",
    description: "Supprime une reprise de ronde existante",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de la reprise de ronde",
  })
  @ApiResponse({
    status: 200,
    description: "Reprise de ronde supprimée",
  })
  @ApiResponse({
    status: 404,
    description: "Reprise de ronde non trouvée",
  })
  async deleteRepriseRonde(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.rondeService.deleteRepriseRonde(id, currentUser.idUsine);
    return { message: "Reprise de ronde supprimée avec succès" };
  }
}
