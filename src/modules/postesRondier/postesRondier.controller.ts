import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { RequireAdmin } from "../../common/decorators";
import { AuthGuard } from "../../common/guards/auth.guard";
import { CreatePosteRondierDto, UpdatePosteRondierDto } from "./dto";
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

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouveau poste rondier" })
  @ApiResponse({ status: 201, description: "Poste rondier créé avec succès" })
  @ApiResponse({
    status: 400,
    description: "Données invalides ou poste rondier déjà utilisé",
  })
  async create(@Body() createPosteRondierDto: CreatePosteRondierDto) {
    return this.postesRondierService.create(createPosteRondierDto);
  }

  @Put(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un poste rondier" })
  @ApiParam({ name: "id", type: "number", description: "ID du poste rondier" })
  @ApiResponse({
    status: 200,
    description: "Poste rondier mis à jour avec succès",
  })
  @ApiResponse({ status: 404, description: "Poste rondier non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updatePosteRondierDto: UpdatePosteRondierDto
  ) {
    await this.postesRondierService.update(id, updatePosteRondierDto);
    return { message: "Poste rondier mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Désactiver un poste rondier (isActif = false)" })
  @ApiParam({ name: "id", type: "number", description: "ID du poste rondier" })
  @ApiResponse({
    status: 200,
    description: "Poste rondier désactivé avec succès",
  })
  @ApiResponse({
    status: 400,
    description: "Impossible de désactiver votre propre compte",
  })
  @ApiResponse({ status: 404, description: "Poste rondier non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.postesRondierService.delete(id);
    return { message: "Poste rondier désactivé avec succès" };
  }
}
