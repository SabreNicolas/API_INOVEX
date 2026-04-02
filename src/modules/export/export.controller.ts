import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeController,
  ApiOperation,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";

import { UserRole } from "../../common/constants";
import { RequireRole } from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import { ExportFilesDto } from "./dto";
import { ExportService } from "./export.service";

@ApiTags("Export")
@ApiCookieAuth()
@ApiExcludeController()
@Controller("export")
@UseGuards(AuthGuard)
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post("files")
  @RequireRole([UserRole.IS_KERLAN])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Exporter des fichiers en ZIP",
    description:
      "Exporte les fichiers d'une catégorie (consignes, événements de quart, modes opératoires) " +
      "filtrés par années et mois, groupés par site dans un archive ZIP.",
  })
  @ApiBody({ type: ExportFilesDto })
  @ApiProduces("application/zip")
  @ApiResponse({
    status: 200,
    description: "Archive ZIP contenant les fichiers exportés",
    content: {
      "application/zip": {
        schema: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: "Paramètres invalides" })
  @ApiResponse({ status: 404, description: "Aucun fichier trouvé" })
  async exportFiles(
    @Body() exportFilesDto: ExportFilesDto,
    @Res() res: Response
  ) {
    const { stream, filename } =
      await this.exportService.exportFiles(exportFilesDto);

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    stream.pipe(res);
  }
}
