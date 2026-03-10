import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { CurrentUser, RequireSuperAdmin } from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import {
  CreateImportTonnageParametreDto,
  UpdateImportTonnageParametreDto,
} from "./dto";
import { ImportTonnageParametreService } from "./import-tonnage-parametre.service";

@ApiTags("Import Tonnage")
@ApiCookieAuth()
@Controller("import-tonnage/parametres")
@UseGuards(AuthGuard)
export class ImportTonnageParametreController {
  constructor(
    private readonly importTonnageParametreService: ImportTonnageParametreService
  ) {}

  @Get()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Récupérer tous les paramètres d'import tonnage",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page (défaut: 1)",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page (défaut: 20, max: 100)",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des paramètres d'import tonnage récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.importTonnageParametreService.findAll(
      pagination,
      currentUser.idUsine
    );
  }

  @Post()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Créer un nouveau paramètre d'import tonnage",
  })
  @ApiResponse({
    status: 201,
    description: "Paramètre d'import tonnage créé avec succès",
  })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateImportTonnageParametreDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.importTonnageParametreService.create(
      createDto,
      currentUser.idUsine
    );
  }

  @Put(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Mettre à jour un paramètre d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre d'import tonnage",
  })
  @ApiResponse({
    status: 200,
    description: "Paramètre d'import tonnage mis à jour avec succès",
  })
  @ApiResponse({
    status: 404,
    description: "Paramètre d'import tonnage non trouvé",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateImportTonnageParametreDto
  ) {
    await this.importTonnageParametreService.update(id, updateDto);
    return { message: "Paramètre d'import tonnage mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Supprimer un paramètre d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre d'import tonnage",
  })
  @ApiResponse({
    status: 200,
    description: "Paramètre d'import tonnage supprimé avec succès",
  })
  @ApiResponse({
    status: 404,
    description: "Paramètre d'import tonnage non trouvé",
  })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageParametreService.delete(id);
    return { message: "Paramètre d'import tonnage supprimé avec succès" };
  }
}
