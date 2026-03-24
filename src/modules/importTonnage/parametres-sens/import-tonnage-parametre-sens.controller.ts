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

import { UserRole } from "@/common/constants";
import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  RequireRole,
} from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard } from "@/common/guards/auth.guard";
import { ImportTonnageParametreSens } from "@/entities";

import {
  CreateImportTonnageParametreSensDto,
  UpdateImportTonnageParametreSensDto,
} from "./dto";
import { ImportTonnageParametreSensService } from "./import-tonnage-parametre-sens.service";

@ApiTags("Import Tonnage")
@ApiCookieAuth()
@Controller("import-tonnage/parametres-sens")
@UseGuards(AuthGuard)
export class ImportTonnageParametreSensController {
  constructor(
    private readonly importTonnageParametreSensService: ImportTonnageParametreSensService
  ) {}

  @Get()
  @RequireRole([UserRole.IS_SUPER_ADMIN, UserRole.IS_SAISIE, UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Récupérer tous les paramètres sens d'import tonnage",
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
  @ApiPaginatedResponseWrapped(ImportTonnageParametreSens)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(@Query() pagination: PaginationDto) {
    return this.importTonnageParametreSensService.findAll(pagination);
  }

  @Post()
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer un nouveau paramètre sens d'import tonnage",
  })
  @ApiCreatedResponseWrapped(ImportTonnageParametreSens)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateImportTonnageParametreSensDto) {
    return this.importTonnageParametreSensService.create(createDto);
  }

  @Put(":id")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Mettre à jour un paramètre sens d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre sens d'import tonnage",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Paramètre sens d'import tonnage non trouvé",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateImportTonnageParametreSensDto
  ) {
    await this.importTonnageParametreSensService.update(id, updateDto);
    return {
      message: "Paramètre sens d'import tonnage mis à jour avec succès",
    };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer un paramètre sens d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre sens d'import tonnage",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Paramètre sens d'import tonnage non trouvé",
  })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageParametreSensService.delete(id);
    return {
      message: "Paramètre sens d'import tonnage supprimé avec succès",
    };
  }
}
