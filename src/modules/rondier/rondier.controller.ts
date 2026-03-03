import { Controller, Get, Res, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ZoneControleService } from "../zone-controle/zone-controle.service";
import { PdfGeneratorService } from "./pdf-generator.service";

@ApiTags("Rondier")
@ApiCookieAuth()
@Controller("rondier")
@UseGuards(AuthGuard)
export class RondierController {
  constructor(
    private readonly zoneControleService: ZoneControleService,
    private readonly pdfGeneratorService: PdfGeneratorService
  ) {}

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
}
