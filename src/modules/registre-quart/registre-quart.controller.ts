import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";

import { UserRole } from "@/common/constants";
import { RequireRole } from "@/common/decorators";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import { LoggerService } from "@/common/services/logger.service";

import { RegistreQuartService } from "./registre-quart.service";
import { RegistreQuartPdfService } from "./registre-quart-pdf.service";

@ApiTags("Registre de Quart")
@ApiCookieAuth()
@Controller("registre-quart")
@UseGuards(AuthGuard)
export class RegistreQuartController {
  constructor(
    private readonly registreQuartService: RegistreQuartService,
    private readonly pdfService: RegistreQuartPdfService,
    private readonly logger: LoggerService
  ) {}

  @Get("last-shift")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Récupérer le dernier quart connu avec une équipe créée",
  })
  @ApiResponse({
    status: 200,
    description: "Date et quart du dernier quart connu",
  })
  async getLastShift(@CurrentUser() currentUser: RequestUser) {
    return this.registreQuartService.getLastShift(currentUser.idUsine);
  }

  @Get("pdf")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({
    summary: "Générer et télécharger le PDF du registre de quart",
  })
  @ApiQuery({
    name: "date",
    required: true,
    type: String,
    description: "Date au format YYYY-MM-DD",
  })
  @ApiQuery({
    name: "quart",
    required: true,
    type: Number,
    description: "1=Matin, 2=Après-midi, 3=Nuit",
  })
  @ApiResponse({ status: 200, description: "Fichier PDF du registre de quart" })
  async downloadPdf(
    @Query("date") date: string,
    @Query("quart") quart: string,
    @CurrentUser() currentUser: RequestUser,
    @Res() res: Response
  ): Promise<void> {
    const quartNum = parseInt(quart, 10);
    const cdqEntrantName = `${currentUser.nom} ${currentUser.prenom}`.trim();

    const data = await this.registreQuartService.getRegistreData(
      currentUser.idUsine,
      date,
      quartNum,
      cdqEntrantName
    );

    const { buffer } = await this.pdfService.generateAndSave(
      data,
      data.siteName
    );

    const safeDate = data.date.replace(/\//g, "-");
    const filename = `Registre_Quart_${data.siteName}_${safeDate}_Q${quartNum}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length.toString(),
    });

    res.send(buffer);

    this.logger.log(
      `PDF registre de quart téléchargé par ${cdqEntrantName} - ${data.siteName} ${date} Q${quartNum}`,
      "RegistreQuartController"
    );
  }
}
