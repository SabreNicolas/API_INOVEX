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

import { RequireRondier } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { CreateQuartLienExterneDto, UpdateQuartLienExterneDto } from "./dto";
import { QuartLiensExternesService } from "./quart-liens-externes.service";

@ApiTags("Quart Liens Externes")
@ApiCookieAuth()
@Controller("quart-liens-externes")
@UseGuards(AuthGuard)
export class QuartLiensExternesController {
  constructor(
    private readonly quartLiensExternesService: QuartLiensExternesService
  ) {}

  @Get()
  @RequireRondier()
  @ApiOperation({ summary: "Récupérer les liens externes du site" })
  @ApiResponse({ status: 200, description: "Liste des liens externes" })
  async findAll(@CurrentUser() currentUser: RequestUser) {
    return this.quartLiensExternesService.findAll(currentUser.idUsine);
  }

  @Post()
  @RequireRondier()
  @ApiOperation({ summary: "Créer un lien externe" })
  @ApiResponse({ status: 201, description: "Lien externe créé avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartLienExterneDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartLiensExternesService.create(
      currentUser.idUsine,
      createDto
    );
  }

  @Patch(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Mettre à jour un lien externe" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du lien externe",
  })
  @ApiResponse({ status: 200, description: "Lien externe mis à jour" })
  @ApiResponse({ status: 404, description: "Lien externe non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartLienExterneDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartLiensExternesService.update(
      id,
      currentUser.idUsine,
      updateDto
    );
    return { message: "Lien externe mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireRondier()
  @ApiOperation({ summary: "Supprimer un lien externe" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du lien externe",
  })
  @ApiResponse({ status: 200, description: "Lien externe supprimé" })
  @ApiResponse({ status: 404, description: "Lien externe non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartLiensExternesService.delete(id, currentUser.idUsine);
    return { message: "Lien externe supprimé avec succès" };
  }
}
