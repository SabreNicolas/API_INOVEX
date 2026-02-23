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

import { RequireSuperAdmin } from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard } from "@/common/guards/auth.guard";

import { CreateSiteDto, UpdateSiteDto } from "./dto";
import { SiteService } from "./site.service";

@ApiTags("Sites")
@ApiCookieAuth()
@Controller("site")
@UseGuards(AuthGuard)
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Récupérer tous les sites",
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
    description: "Liste des sites récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(@Query() pagination: PaginationDto) {
    return this.siteService.findAll(pagination);
  }

  @Get(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Récupérer un site par ID",
  })
  @ApiParam({ name: "id", type: "number", description: "ID du site" })
  @ApiResponse({ status: 200, description: "Site trouvé" })
  @ApiResponse({ status: 404, description: "Site non trouvé" })
  async findOne(@Param("id", ParseIntPipe) id: number) {
    return this.siteService.findOne(id);
  }

  @Post()
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Créer un nouveau site",
  })
  @ApiResponse({ status: 201, description: "Site créé avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(@Body() createSiteDto: CreateSiteDto) {
    return this.siteService.create(createSiteDto);
  }

  @Put(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Mettre à jour un site",
  })
  @ApiParam({ name: "id", type: "number", description: "ID du site" })
  @ApiResponse({ status: 200, description: "Site mis à jour avec succès" })
  @ApiResponse({ status: 404, description: "Site non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto
  ) {
    await this.siteService.update(id, updateSiteDto);
    return { message: "Site mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Supprimer un site",
  })
  @ApiParam({ name: "id", type: "number", description: "ID du site" })
  @ApiResponse({ status: 200, description: "Site supprimé avec succès" })
  @ApiResponse({ status: 404, description: "Site non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.siteService.delete(id);
    return { message: "Site supprimé avec succès" };
  }
}
