import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { RequireAdmin } from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PostesRondierService } from "./postesRondier.service";

@ApiTags("Postes Rondier")
@ApiCookieAuth()
@Controller("postes-rondier")
@UseGuards(AuthGuard)
export class PostesRondierController {
  constructor(private readonly postesRondierService: PostesRondierService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les postes rondier (avec pagination optionnelle)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des postes rondier récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll() {
    return this.postesRondierService.findAll();
  }
}
