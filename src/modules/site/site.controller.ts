import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  RequireSuperAdmin,
} from "@/common/decorators";
import { Site } from "@/entities";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard } from "@/common/guards/auth.guard";

import { UpdateSiteDto } from "./dto";
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
  @ApiPaginatedResponseWrapped(Site)
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(@Query() pagination: PaginationDto) {
    return this.siteService.findAll(pagination);
  }

  @Put(":id")
  @RequireSuperAdmin()
  @ApiOperation({
    summary: "Mettre à jour un site",
  })
  @ApiParam({ name: "id", type: "number", description: "ID du site" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Site non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateSiteDto: UpdateSiteDto
  ) {
    await this.siteService.update(id, updateSiteDto);
    return { message: "Site mis à jour avec succès" };
  }
}
