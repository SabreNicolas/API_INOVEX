import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import {
  ApiBody,
  ApiConsumes,
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
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { ModeOperatoire } from "../../entities";
import { CreateModeOperatoireDto, UpdateModeOperatoireDto } from "./dto";
import { ModeOperatoireService } from "./mode-operatoire.service";

@ApiTags("Modes opératoires")
@ApiCookieAuth()
@Controller("modes-operatoires")
@UseGuards(AuthGuard)
export class ModeOperatoireController {
  constructor(private readonly modeOperatoireService: ModeOperatoireService) {}

  @Get()
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Récupérer tous les modes opératoires" })
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
  @ApiPaginatedResponseWrapped(ModeOperatoire)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.modeOperatoireService.findAll(currentUser.idUsine, pagination);
  }

  @Post()
  @RequireRole([UserRole.IS_ADMIN])
  @UseInterceptors(FileInterceptor("fichier"))
  @ApiOperation({ summary: "Créer un nouveau mode opératoire avec fichier" })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      required: ["nom", "fichier"],
      properties: {
        nom: { type: "string", description: "Nom du mode opératoire" },
        zoneId: { type: "number", description: "ID de la zone associée" },
        fichier: {
          type: "string",
          format: "binary",
          description: "Fichier du mode opératoire",
        },
      },
    },
  })
  @ApiCreatedResponseWrapped(ModeOperatoire)
  @ApiResponse({
    status: 400,
    description: "Données invalides ou fichier manquant",
  })
  async create(
    @Body() createDto: CreateModeOperatoireDto,
    @CurrentUser() currentUser: RequestUser,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException("Le fichier est obligatoire");
    }
    return this.modeOperatoireService.create(
      createDto,
      file,
      currentUser.idUsine
    );
  }

  @Patch(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @UseInterceptors(FileInterceptor("fichier"))
  @ApiOperation({ summary: "Mettre à jour un mode opératoire" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du mode opératoire",
  })
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        nom: { type: "string", description: "Nom du mode opératoire" },
        zoneId: { type: "number", description: "ID de la zone associée" },
        fichier: {
          type: "string",
          format: "binary",
          description: "Nouveau fichier du mode opératoire (optionnel)",
        },
      },
    },
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Mode opératoire non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateModeOperatoireDto,
    @CurrentUser() currentUser: RequestUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    await this.modeOperatoireService.update(
      id,
      updateDto,
      file,
      currentUser.idUsine
    );
    return { message: "Mode opératoire mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([UserRole.IS_ADMIN])
  @ApiOperation({ summary: "Supprimer un mode opératoire" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID du mode opératoire",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Mode opératoire non trouvé" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.modeOperatoireService.delete(id);
    return { message: "Mode opératoire supprimé avec succès" };
  }
}
