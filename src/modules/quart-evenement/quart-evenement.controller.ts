import {
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
  ApiOkArrayResponseWrapped,
  ApiPaginatedResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DateRangeQueryDto } from "../../common/dto/date-range-query.dto";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { FileUploadService } from "../../common/services/file-upload.service";
import { QuartEvenement } from "../../entities";
import { CreateQuartEvenementDto, UpdateQuartEvenementDto } from "./dto";
import { QuartEvenementService } from "./quart-evenement.service";

@ApiTags("Quart Événements")
@ApiCookieAuth()
@Controller("quart-evenements")
@UseGuards(AuthGuard)
export class QuartEvenementController {
  constructor(
    private readonly quartEvenementService: QuartEvenementService,
    private readonly fileUploadService: FileUploadService
  ) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer tous les événements" })
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
  @ApiPaginatedResponseWrapped(QuartEvenement)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartEvenementService.findAll(currentUser.idUsine, pagination);
  }

  @Get("by-date")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les événements par plage de dates" })
  @ApiOkArrayResponseWrapped(QuartEvenement)
  async findByDateRange(
    @Query() query: DateRangeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.quartEvenementService.findByDateRange(
      currentUser.idUsine,
      new Date(query.dateDebut),
      new Date(query.dateFin)
    );
  }

  @Post()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Créer un nouvel événement" })
  @ApiBody({
    description: "Création d'un événement avec fichier optionnel",
    schema: {
      type: "object",
      properties: {
        titre: { type: "string", example: "Panne équipement" },
        description: { type: "string", example: "Description détaillée" },
        date_heure_debut: { type: "string", format: "date-time" },
        date_heure_fin: { type: "string", format: "date-time" },
        groupementGMAO: { type: "string" },
        equipementGMAO: { type: "string" },
        importance: { type: "number", example: 1 },
        demande_travaux: { type: "string" },
        consigne: { type: "number", example: 0 },
        cause: { type: "string" },
        file: { type: "string", format: "binary" },
      },
      required: ["titre", "date_heure_debut", "date_heure_fin"],
    },
  })
  @ApiCreatedResponseWrapped(QuartEvenement)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateQuartEvenementDto,
    @CurrentUser() currentUser: RequestUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let fileUrl: string | undefined;
    if (file) {
      const uploadedFile = await this.fileUploadService.saveQuartEvenementFile(
        file,
        currentUser.idUsine,
        createDto.date_heure_debut
          ? new Date(createDto.date_heure_debut)
          : undefined
      );
      fileUrl = uploadedFile.url;
    }
    return this.quartEvenementService.create(
      createDto,
      currentUser.idUsine,
      fileUrl
    );
  }

  @Patch(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Mettre à jour un événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'événement",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Événement non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateQuartEvenementDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartEvenementService.update(id, currentUser.idUsine, updateDto);
    return { message: "Événement mis à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Supprimer un événement" })
  @ApiParam({
    name: "id",
    type: "number",
    description: "ID de l'événement",
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Événement non trouvé" })
  async delete(
    @Param("id", ParseIntPipe) id: number,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.quartEvenementService.delete(id, currentUser.idUsine);
    return { message: "Événement supprimé avec succès" };
  }
}
