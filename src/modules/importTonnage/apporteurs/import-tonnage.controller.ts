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

import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  CurrentUser,
  RequireSuperAdmin,
} from "@/common/decorators";
import { ImportTonnage } from "@/entities";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import { CreateImportTonnageDto, UpdateImportTonnageDto } from "./dto";
import { ImportTonnageService } from "./import-tonnage.service";

@ApiTags("Import Tonnage")
@ApiCookieAuth()
@Controller("import-tonnage/apporteurs")
@UseGuards(AuthGuard)
export class ImportTonnageController {
  constructor(private readonly importTonnageService: ImportTonnageService) {}

  @Get()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Récupérer tous les imports tonnage apporteurs",
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
  @ApiPaginatedResponseWrapped(ImportTonnage)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.importTonnageService.findAll(pagination, currentUser.idUsine);
  }

  @Post()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Créer un nouvel import tonnage",
  })
  @ApiCreatedResponseWrapped(ImportTonnage)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateImportTonnageDto) {
    return this.importTonnageService.create(createDto);
  }

  @Put(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Mettre à jour un import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Import tonnage non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateImportTonnageDto
  ) {
    await this.importTonnageService.update(id, updateDto);
    return { message: "Import tonnage mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Supprimer un import tonnage",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Import tonnage non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageService.delete(id);
    return { message: "Import tonnage supprimé avec succès" };
  }
}
