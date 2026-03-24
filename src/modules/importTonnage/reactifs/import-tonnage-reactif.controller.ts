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
import { ImportTonnageReactif } from "@/entities";

import {
  CreateImportTonnageReactifDto,
  UpdateImportTonnageReactifDto,
} from "./dto";
import { ImportTonnageReactifService } from "./import-tonnage-reactif.service";

@ApiTags("Import Tonnage")
@ApiCookieAuth()
@Controller("import-tonnage/reactifs")
@UseGuards(AuthGuard)
export class ImportTonnageReactifController {
  constructor(
    private readonly importTonnageReactifService: ImportTonnageReactifService
  ) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN, UserRole.IS_SAISIE, UserRole.IS_SUPER_ADMIN])
  @ApiOperation({
    summary: "Récupérer tous les imports tonnage réactifs",
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
  @ApiPaginatedResponseWrapped(ImportTonnageReactif)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.importTonnageReactifService.findAll(
      pagination,
      currentUser.idUsine
    );
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Créer un nouvel import tonnage réactif",
  })
  @ApiCreatedResponseWrapped(ImportTonnageReactif)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createDto: CreateImportTonnageReactifDto) {
    return this.importTonnageReactifService.create(createDto);
  }

  @Put(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Mettre à jour un import tonnage réactif",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage réactif",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Import tonnage réactif non trouvé",
  })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateImportTonnageReactifDto
  ) {
    await this.importTonnageReactifService.update(id, updateDto);
    return { message: "Import tonnage réactif mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({
    summary: "Supprimer un import tonnage réactif",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'import tonnage réactif",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({
    status: 404,
    description: "Import tonnage réactif non trouvé",
  })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.importTonnageReactifService.delete(id);
    return { message: "Import tonnage réactif supprimé avec succès" };
  }
}
