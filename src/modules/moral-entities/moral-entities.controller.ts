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
import { MoralEntityNew } from "@/entities";

import { CreateMoralEntityDto, UpdateMoralEntityDto } from "./dto";
import { MoralEntitiesService } from "./moral-entities.service";

@ApiTags("Entités morales")
@ApiCookieAuth()
@Controller("moral-entities")
@UseGuards(AuthGuard)
export class MoralEntitiesController {
  constructor(private readonly moralEntitiesService: MoralEntitiesService) {}

  @Get()
  @RequireRole([UserRole.IS_SAISIE])
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
  @ApiPaginatedResponseWrapped(MoralEntityNew)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.moralEntitiesService.findAll(currentUser.idUsine, pagination);
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Créer une nouvelle entité morale" })
  @ApiCreatedResponseWrapped(MoralEntityNew)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateMoralEntityDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.moralEntitiesService.create(createDto, currentUser.idUsine);
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Mettre à jour une entité morale" })
  @ApiParam({ name: "id", type: Number, description: "ID de l'entité morale" })
  @ApiMessageResponseWrapped()
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
