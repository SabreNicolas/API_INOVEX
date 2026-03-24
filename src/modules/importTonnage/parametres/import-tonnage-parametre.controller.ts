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
  CurrentUser,
  RequireRole,
} from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";
import { ImportTonnageParametre } from "@/entities";

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
  @RequireRole([UserRole.IS_SUPER_ADMIN, UserRole.IS_SAISIE, UserRole.IS_ADMIN])
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
  @ApiPaginatedResponseWrapped(ImportTonnageParametre)
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
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Créer un nouveau paramètre d'import tonnage",
  })
  @ApiCreatedResponseWrapped(ImportTonnageParametre)
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
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Mettre à jour un paramètre d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre d'import tonnage",
  })
  @ApiMessageResponseWrapped()
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
  @RequireRole([UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Supprimer un paramètre d'import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du paramètre d'import tonnage",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Paramètre d'import tonnage non trouvé",
  })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageParametreService.delete(id);
    return { message: "Paramètre d'import tonnage supprimé avec succès" };
  }
}
