import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiExcludeController,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { UserRole } from "../../common/constants";
import {
  ApiMessageResponseWrapped,
  ApiPaginatedResponseWrapped,
  RequireRole,
} from "../../common/decorators";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import {
  ConsigneType,
  Conversion,
  PosteRondier,
  QuartEvenementCause,
  Rapport,
  Site,
} from "../../entities";
import { AdminKerlanService } from "./admin-kerlan.service";
import {
  CreateConsigneTypeDto,
  CreateConversionDto,
  CreatePosteRondierDto,
  CreateQuartEvenementCauseDto,
  CreateRapportDto,
  CreateSiteDto,
  UpdateConsigneTypeDto,
  UpdateConversionDto,
  UpdatePosteRondierDto,
  UpdateQuartEvenementCauseDto,
  UpdateRapportDto,
  UpdateSiteDto,
} from "./dto";

@ApiTags("Administration Kerlan")
@ApiCookieAuth()
@ApiExcludeController()
@Controller("admin-kerlan")
@UseGuards(AuthGuard)
@RequireRole([UserRole.IS_KERLAN])
export class AdminKerlanController {
  constructor(private readonly adminKerlanService: AdminKerlanService) {}

  // ==================== SITES ====================

  @Get("sites")
  @ApiOperation({ summary: "Récupérer tous les sites" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(Site)
  async findAllSites(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllSites(pagination);
  }

  @Get("sites/:id")
  @ApiOperation({ summary: "Récupérer un site par ID" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 200, type: Site })
  @ApiResponse({ status: 404, description: "Site non trouvé" })
  async findOneSite(@Param("id", ParseIntPipe) id: number) {
    return this.adminKerlanService.findOneSite(id);
  }

  @Post("sites")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un site" })
  @ApiBody({ type: CreateSiteDto })
  @ApiResponse({ status: 201, description: "Site créé" })
  async createSite(@Body() dto: CreateSiteDto) {
    return this.adminKerlanService.createSite(dto);
  }

  @Put("sites/:id")
  @ApiOperation({ summary: "Mettre à jour un site" })
  @ApiParam({ name: "id", type: "number" })
  @ApiBody({ type: UpdateSiteDto })
  @ApiMessageResponseWrapped()
  async updateSite(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateSiteDto
  ) {
    await this.adminKerlanService.updateSite(id, dto);
    return { message: "Site mis à jour avec succès" };
  }

  // ==================== CONSIGNE TYPES ====================

  @Get("consigne-types")
  @ApiOperation({ summary: "Récupérer tous les types de consigne" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(ConsigneType)
  async findAllConsigneTypes(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllConsigneTypes(pagination);
  }

  @Get("consigne-types/:id")
  @ApiOperation({ summary: "Récupérer un type de consigne par ID" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 200, type: ConsigneType })
  @ApiResponse({ status: 404, description: "Type de consigne non trouvé" })
  async findOneConsigneType(@Param("id", ParseIntPipe) id: number) {
    return this.adminKerlanService.findOneConsigneType(id);
  }

  @Post("consigne-types")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un type de consigne" })
  @ApiBody({ type: CreateConsigneTypeDto })
  @ApiResponse({ status: 201, description: "Type de consigne créé" })
  async createConsigneType(@Body() dto: CreateConsigneTypeDto) {
    return this.adminKerlanService.createConsigneType(dto);
  }

  @Put("consigne-types/:id")
  @ApiOperation({ summary: "Mettre à jour un type de consigne" })
  @ApiParam({ name: "id", type: "number" })
  @ApiBody({ type: UpdateConsigneTypeDto })
  @ApiMessageResponseWrapped()
  async updateConsigneType(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateConsigneTypeDto
  ) {
    await this.adminKerlanService.updateConsigneType(id, dto);
    return { message: "Type de consigne mis à jour avec succès" };
  }

  @Delete("consigne-types/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un type de consigne" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 204, description: "Type de consigne supprimé" })
  async deleteConsigneType(@Param("id", ParseIntPipe) id: number) {
    await this.adminKerlanService.deleteConsigneType(id);
  }

  // ==================== QUART EVENEMENT CAUSES ====================

  @Get("quart-evenement-causes")
  @ApiOperation({ summary: "Récupérer toutes les causes d'événement" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(QuartEvenementCause)
  async findAllQuartEvenementCauses(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllQuartEvenementCauses(pagination);
  }

  @Get("quart-evenement-causes/:id")
  @ApiOperation({ summary: "Récupérer une cause d'événement par ID" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 200, type: QuartEvenementCause })
  @ApiResponse({ status: 404, description: "Cause d'événement non trouvée" })
  async findOneQuartEvenementCause(@Param("id", ParseIntPipe) id: number) {
    return this.adminKerlanService.findOneQuartEvenementCause(id);
  }

  @Post("quart-evenement-causes")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une cause d'événement" })
  @ApiBody({ type: CreateQuartEvenementCauseDto })
  @ApiResponse({ status: 201, description: "Cause d'événement créée" })
  async createQuartEvenementCause(@Body() dto: CreateQuartEvenementCauseDto) {
    return this.adminKerlanService.createQuartEvenementCause(dto);
  }

  @Put("quart-evenement-causes/:id")
  @ApiOperation({ summary: "Mettre à jour une cause d'événement" })
  @ApiParam({ name: "id", type: "number" })
  @ApiBody({ type: UpdateQuartEvenementCauseDto })
  @ApiMessageResponseWrapped()
  async updateQuartEvenementCause(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateQuartEvenementCauseDto
  ) {
    await this.adminKerlanService.updateQuartEvenementCause(id, dto);
    return { message: "Cause d'événement mise à jour avec succès" };
  }

  @Delete("quart-evenement-causes/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une cause d'événement" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 204, description: "Cause d'événement supprimée" })
  async deleteQuartEvenementCause(@Param("id", ParseIntPipe) id: number) {
    await this.adminKerlanService.deleteQuartEvenementCause(id);
  }

  // ==================== RAPPORTS ====================

  @Get("rapports")
  @ApiOperation({ summary: "Récupérer tous les rapports" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(Rapport)
  async findAllRapports(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllRapports(pagination);
  }

  @Get("rapports/:id")
  @ApiOperation({ summary: "Récupérer un rapport par ID" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 200, type: Rapport })
  @ApiResponse({ status: 404, description: "Rapport non trouvé" })
  async findOneRapport(@Param("id", ParseIntPipe) id: number) {
    return this.adminKerlanService.findOneRapport(id);
  }

  @Post("rapports")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un rapport" })
  @ApiBody({ type: CreateRapportDto })
  @ApiResponse({ status: 201, description: "Rapport créé" })
  async createRapport(@Body() dto: CreateRapportDto) {
    return this.adminKerlanService.createRapport(dto);
  }

  @Put("rapports/:id")
  @ApiOperation({ summary: "Mettre à jour un rapport" })
  @ApiParam({ name: "id", type: "number" })
  @ApiBody({ type: UpdateRapportDto })
  @ApiMessageResponseWrapped()
  async updateRapport(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRapportDto
  ) {
    await this.adminKerlanService.updateRapport(id, dto);
    return { message: "Rapport mis à jour avec succès" };
  }

  @Delete("rapports/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un rapport" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 204, description: "Rapport supprimé" })
  async deleteRapport(@Param("id", ParseIntPipe) id: number) {
    await this.adminKerlanService.deleteRapport(id);
  }

  // ==================== POSTES RONDIER ====================

  @Get("postes-rondier")
  @ApiOperation({ summary: "Récupérer tous les postes rondier" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(PosteRondier)
  async findAllPostesRondier(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllPostesRondier(pagination);
  }

  @Get("postes-rondier/:id")
  @ApiOperation({ summary: "Récupérer un poste rondier par ID" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 200, type: PosteRondier })
  @ApiResponse({ status: 404, description: "Poste rondier non trouvé" })
  async findOnePosteRondier(@Param("id", ParseIntPipe) id: number) {
    return this.adminKerlanService.findOnePosteRondier(id);
  }

  @Post("postes-rondier")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un poste rondier" })
  @ApiBody({ type: CreatePosteRondierDto })
  @ApiResponse({ status: 201, description: "Poste rondier créé" })
  async createPosteRondier(@Body() dto: CreatePosteRondierDto) {
    return this.adminKerlanService.createPosteRondier(dto);
  }

  @Put("postes-rondier/:id")
  @ApiOperation({ summary: "Mettre à jour un poste rondier" })
  @ApiParam({ name: "id", type: "number" })
  @ApiBody({ type: UpdatePosteRondierDto })
  @ApiMessageResponseWrapped()
  async updatePosteRondier(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePosteRondierDto
  ) {
    await this.adminKerlanService.updatePosteRondier(id, dto);
    return { message: "Poste rondier mis à jour avec succès" };
  }

  @Delete("postes-rondier/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer un poste rondier" })
  @ApiParam({ name: "id", type: "number" })
  @ApiResponse({ status: 204, description: "Poste rondier supprimé" })
  async deletePosteRondier(@Param("id", ParseIntPipe) id: number) {
    await this.adminKerlanService.deletePosteRondier(id);
  }

  // ==================== CONVERSIONS ====================

  @Get("conversions")
  @ApiOperation({ summary: "Récupérer toutes les conversions" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiPaginatedResponseWrapped(Conversion)
  async findAllConversions(@Query() pagination: PaginationDto) {
    return this.adminKerlanService.findAllConversions(pagination);
  }

  @Get("conversions/:uniteBase/:uniteCible")
  @ApiOperation({ summary: "Récupérer une conversion par ses clés" })
  @ApiParam({ name: "uniteBase", type: "string" })
  @ApiParam({ name: "uniteCible", type: "string" })
  @ApiResponse({ status: 200, type: Conversion })
  @ApiResponse({ status: 404, description: "Conversion non trouvée" })
  async findOneConversion(
    @Param("uniteBase") uniteBase: string,
    @Param("uniteCible") uniteCible: string
  ) {
    return this.adminKerlanService.findOneConversion(uniteBase, uniteCible);
  }

  @Post("conversions")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer une conversion" })
  @ApiBody({ type: CreateConversionDto })
  @ApiResponse({ status: 201, description: "Conversion créée" })
  @ApiResponse({ status: 400, description: "La conversion existe déjà" })
  async createConversion(@Body() dto: CreateConversionDto) {
    return this.adminKerlanService.createConversion(dto);
  }

  @Put("conversions/:uniteBase/:uniteCible")
  @ApiOperation({ summary: "Mettre à jour une conversion" })
  @ApiParam({ name: "uniteBase", type: "string" })
  @ApiParam({ name: "uniteCible", type: "string" })
  @ApiBody({ type: UpdateConversionDto })
  @ApiMessageResponseWrapped()
  async updateConversion(
    @Param("uniteBase") uniteBase: string,
    @Param("uniteCible") uniteCible: string,
    @Body() dto: UpdateConversionDto
  ) {
    await this.adminKerlanService.updateConversion(uniteBase, uniteCible, dto);
    return { message: "Conversion mise à jour avec succès" };
  }

  @Delete("conversions/:uniteBase/:uniteCible")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Supprimer une conversion" })
  @ApiParam({ name: "uniteBase", type: "string" })
  @ApiParam({ name: "uniteCible", type: "string" })
  @ApiResponse({ status: 204, description: "Conversion supprimée" })
  async deleteConversion(
    @Param("uniteBase") uniteBase: string,
    @Param("uniteCible") uniteCible: string
  ) {
    await this.adminKerlanService.deleteConversion(uniteBase, uniteCible);
  }
}
