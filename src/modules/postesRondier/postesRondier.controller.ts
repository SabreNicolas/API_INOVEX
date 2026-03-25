import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "@/common/constants";

import {
  ApiOkArrayResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PosteRondier } from "../../entities";
import { PostesRondierService } from "./postesRondier.service";

@ApiTags("Postes Rondier")
@ApiCookieAuth()
@Controller("postes-rondier")
@UseGuards(AuthGuard)
export class PostesRondierController {
  constructor(private readonly postesRondierService: PostesRondierService) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_CHEF_QUART, UserRole.IS_RONDIER])
  @ApiOperation({
    summary: "Récupérer tous les postes rondier (avec pagination optionnelle)",
  })
  @ApiOkArrayResponseWrapped(PosteRondier)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll() {
    return this.postesRondierService.findAll();
  }
}
