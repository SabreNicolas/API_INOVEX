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
import { ImportTonnageSortant } from "@/entities";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import {
  CreateImportTonnageSortantDto,
  UpdateImportTonnageSortantDto,
} from "./dto";
import { ImportTonnageSortantService } from "./import-tonnage-sortant.service";

@ApiTags("Import Tonnage")
@ApiCookieAuth()
@Controller("import-tonnage/sortants")
@UseGuards(AuthGuard)
export class ImportTonnageSortantController {
  constructor(
    private readonly importTonnageSortantService: ImportTonnageSortantService
  ) {}

  @Get()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Récupérer tous les imports tonnage sortants",
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
  @ApiPaginatedResponseWrapped(ImportTonnageSortant)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.importTonnageSortantService.findAll(
      pagination,
      currentUser.idUsine
    );
  }

  @Post()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Créer un nouvel import tonnage sortant",
  })
  @ApiCreatedResponseWrapped(ImportTonnageSortant)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateImportTonnageSortantDto) {
    return this.importTonnageSortantService.create(createDto);
  }

  @Put(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Mettre à jour un import tonnage sortant",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage sortant",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Import tonnage sortant non trouvé",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateImportTonnageSortantDto
  ) {
    await this.importTonnageSortantService.update(id, updateDto);
    return { message: "Import tonnage sortant mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Supprimer un import tonnage sortant",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage sortant",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Import tonnage sortant non trouvé",
  })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageSortantService.delete(id);
    return { message: "Import tonnage sortant supprimé avec succès" };
  }
}
