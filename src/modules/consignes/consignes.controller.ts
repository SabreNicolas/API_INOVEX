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
import { Consigne, ConsigneType } from "../../entities";
import { ConsignesService } from "./consignes.service";
import {
  ActiveOnDateQueryDto,
  CreateConsigneDto,
  UpdateConsigneDto,
} from "./dto";

@ApiTags("Consignes")
@ApiCookieAuth()
@Controller("consignes")
@UseGuards(AuthGuard)
export class ConsignesController {
  constructor(
    private readonly consignesService: ConsignesService,
    private readonly fileUploadService: FileUploadService
  ) {}

  @Get()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer toutes les consignes" })
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
  @ApiPaginatedResponseWrapped(Consigne)
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.consignesService.findAll(currentUser.idUsine, pagination);
  }

  @Get("active-on-date")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les consignes actives sur une date" })
  @ApiPaginatedResponseWrapped(Consigne)
  async findActiveOnDate(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.consignesService.findActiveOnDate(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("by-date")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les consignes par plage de dates" })
  @ApiPaginatedResponseWrapped(Consigne)
  async findByDateRange(
    @Query() query: DateRangeQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.consignesService.findByDateRange(
      currentUser.idUsine,
      new Date(query.dateDebut),
      new Date(query.dateFin),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("inactive")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les consignes inactives sur une date" })
  @ApiPaginatedResponseWrapped(Consigne)
  async findInactive(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.consignesService.findInactive(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("futur")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les consignes à venir après une date" })
  @ApiPaginatedResponseWrapped(Consigne)
  async findFuture(
    @Query() query: ActiveOnDateQueryDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.consignesService.findFuture(
      currentUser.idUsine,
      new Date(query.date),
      { page: query.page, limit: query.limit }
    );
  }

  @Get("types")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Récupérer les types de consignes" })
  @ApiOkArrayResponseWrapped(ConsigneType)
  async findTypes() {
    return this.consignesService.findTypes();
  }

  @Post()
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Créer une nouvelle consigne" })
  @ApiBody({
    description: "Création d'une consigne avec fichier optionnel",
    schema: {
      type: "object",
      properties: {
        titre: { type: "string", example: "Consigne de sécurité" },
        description: { type: "string", example: "Description détaillée" },
        dateDebut: { type: "string", format: "date-time" },
        dateFin: { type: "string", format: "date-time" },
        type: { type: "number", example: 1 },
        file: { type: "string", format: "binary" },
      },
      required: ["titre"],
    },
  })
  @ApiCreatedResponseWrapped(Consigne)
  @ApiResponse({ status: 400, description: "Données invalides" })
  async create(
    @Body() createDto: CreateConsigneDto,
    @CurrentUser() currentUser: RequestUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let fileUrl: string | undefined;
    if (file) {
      const uploadedFile = await this.fileUploadService.saveConsigneFile(
        file,
        currentUser.idUsine,
        createDto.date_heure_debut
          ? new Date(createDto.date_heure_debut)
          : undefined
      );
      fileUrl = uploadedFile.url;
    }
    return this.consignesService.create(
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
  @UseInterceptors(FileInterceptor("file"))
  @ApiConsumes("multipart/form-data")
  @ApiOperation({ summary: "Mettre à jour une consigne" })
  @ApiParam({ name: "id", type: "number", description: "ID de la consigne" })
  @ApiBody({
    description: "Mise à jour d'une consigne avec fichier optionnel",
    schema: {
      type: "object",
      properties: {
        titre: { type: "string", example: "Consigne modifiée" },
        description: { type: "string", example: "Description mise à jour" },
        dateDebut: { type: "string", format: "date-time" },
        dateFin: { type: "string", format: "date-time" },
        type: { type: "number", example: 1 },
        isActive: { type: "number", example: 1 },
        file: { type: "string", format: "binary" },
      },
    },
  })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Consigne non trouvée" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateDto: UpdateConsigneDto,
    @CurrentUser() currentUser: RequestUser,
    @UploadedFile() file?: Express.Multer.File
  ) {
    let fileUrl: string | undefined;
    if (file) {
      const uploadedFile = await this.fileUploadService.saveConsigneFile(
        file,
        currentUser.idUsine,
        updateDto.date_heure_debut
          ? new Date(updateDto.date_heure_debut)
          : undefined
      );
      fileUrl = uploadedFile.url;
    }
    await this.consignesService.update(
      id,
      updateDto,
      fileUrl,
      this.fileUploadService
    );
    return { message: "Consigne mise à jour avec succès" };
  }

  @Delete(":id")
  @RequireRole([
    UserRole.IS_ADMIN,
    UserRole.IS_SUPER_ADMIN,
    UserRole.IS_CHEF_QUART,
  ])
  @ApiOperation({ summary: "Supprimer une consigne" })
  @ApiParam({ name: "id", type: "number", description: "ID de la consigne" })
  @ApiMessageResponseWrapped()
  @ApiResponse({ status: 404, description: "Consigne non trouvée" })
  async delete(@Param("id", ParseIntPipe) id: number) {
    await this.consignesService.delete(id);
    return { message: "Consigne supprimée avec succès" };
  }
}
