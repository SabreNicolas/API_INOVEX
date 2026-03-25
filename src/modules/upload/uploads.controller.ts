import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { existsSync } from "fs";
import { resolve } from "path";

import { UserRole } from "@/common/constants";

import { RequireRole } from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";

@ApiTags("Uploads")
@ApiCookieAuth()
@Controller("uploads")
@UseGuards(AuthGuard)
export class UploadsController {
  private readonly uploadsRoot = resolve(process.cwd(), "uploads");

  @Get("*path")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_CHEF_QUART,
    UserRole.IS_RONDIER,
    UserRole.IS_SAISIE,
    UserRole.IS_SUPER_ADMIN,
  ])
  @ApiOperation({ summary: "Télécharger un fichier uploadé (authentifié)" })
  @ApiParam({
    name: "path",
    description: "Chemin relatif du fichier dans le dossier uploads",
  })
  serveFile(@Param("path") filePath: string, @Res() res: Response): void {
    const resolvedPath = resolve(this.uploadsRoot, filePath);

    // Protection path traversal
    if (!resolvedPath.startsWith(this.uploadsRoot)) {
      throw new NotFoundException("Fichier non trouvé");
    }

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!existsSync(resolvedPath)) {
      throw new NotFoundException("Fichier non trouvé");
    }

    res.sendFile(resolvedPath);
  }
}
