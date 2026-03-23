import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
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

import { CurrentUser, RequireAdmin } from "@/common/decorators";
import { PaginationDto } from "@/common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "@/common/guards/auth.guard";

import { CreateMoralEntityDto, UpdateMoralEntityDto } from "./dto";
import { MoralEntitiesService } from "./moral-entities.service";

@ApiTags("Entités morales")
@ApiCookieAuth()
@Controller("moral-entities")
@UseGuards(AuthGuard)
export class MoralEntitiesController {
  constructor(private readonly moralEntitiesService: MoralEntitiesService) {}

  @Get()
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer toutes les entités morales avec leur type de déchet",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Numéro de page",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Éléments par page",
  })
  @ApiResponse({ status: 200, description: "Liste des entités morales" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.moralEntitiesService.findAll(currentUser.idUsine, pagination);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer une nouvelle entité morale" })
  @ApiResponse({ status: 201, description: "Entité morale créée avec succès" })
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateMoralEntityDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.moralEntitiesService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour une entité morale" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'entité morale" })
  @ApiResponse({ status: 200, description: "Entité morale mise à jour" })
  @ApiResponse({ status: 404, description: "Entité morale non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateMoralEntityDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.moralEntitiesService.update(id, currentUser.idUsine, updateDto);
    return { message: "Entité morale mise à jour avec succès" };
  }
}
