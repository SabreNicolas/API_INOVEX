import {
  Body,
  Controller,
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
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import {
  ApiCreatedResponseWrapped,
  ApiMessageResponseWrapped,
  ApiOkResponseWrapped,
  CurrentUser,
  RequireAdmin,
  RequireRondier,
} from "../../common/decorators";
import { Equipe } from "../../entities";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { CreateEquipeDto, EquipeQueryDto, UpdateEquipeDto } from "./dto";
import { EquipeService } from "./equipe.service";

@ApiTags("Equipe")
@ApiCookieAuth()
@Controller("equipe")
@UseGuards(AuthGuard)
export class EquipeController {
  constructor(private readonly equipeService: EquipeService) {}

  @Get("by-date")
  @RequireRondier()
  @ApiOperation({
    summary: "Récupérer l'équipe sur une date et un quart",
  })
  @ApiOkResponseWrapped(Equipe)
  async findByDateAndQuart(
    @Query() query: EquipeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.equipeService.findByDateAndQuart(
      currentUser.idUsine,
      query.date,
      query.quart
    );
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({
    summary: "Créer une équipe avec ses affectations",
  })
  @ApiCreatedResponseWrapped(Equipe)
  @ApiResponse({
    status: 400,
    description: "Données invalides ou nom déjà utilisé",
  })
  async create(@Body() createDto: CreateEquipeDto) {
    return this.equipeService.create(createDto);
  }

  @Put(":id")
  @RequireAdmin()
  @ApiOperation({
    summary:
      "Mettre à jour une équipe et ses affectations. Les affectations absentes de la liste sont supprimées.",
  })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'équipe",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Équipe non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateEquipeDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.equipeService.update(id, updateDto, currentUser.idUsine);
    return { message: "Équipe mise à jour avec succès" };
  }
}
