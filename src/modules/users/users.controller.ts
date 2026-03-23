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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

import { RequireAdmin } from "../../common/decorators";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PaginationDto } from "../../common/dto/pagination.dto";
import { AuthGuard, RequestUser } from "../../common/guards/auth.guard";
import { CreateUserDto, UpdateUserDto } from "./dto";
import { UsersService } from "./users.service";

@ApiTags("Utilisateurs")
@ApiCookieAuth()
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("rondier")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les utilisateurs rondiers",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des utilisateurs rondiers récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findRondiers(@CurrentUser() currentUser: RequestUser) {
    return this.usersService.findRondiers(currentUser.idUsine);
  }

  @Get("email")
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les utilisateurs ayant un email",
  })
  @ApiResponse({
    status: 200,
    description: "Liste des utilisateurs avec email récupérée",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findWithEmail(@CurrentUser() currentUser: RequestUser) {
    return this.usersService.findWithEmail(currentUser.idUsine);
  }

  @Get()
  @RequireAdmin()
  @ApiOperation({
    summary: "Récupérer tous les utilisateurs (avec pagination optionnelle)",
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
    description: "Liste des utilisateurs récupérée avec succès",
  })
  @ApiResponse({ status: 401, description: "Non autorisé" })
  @ApiResponse({ status: 403, description: "Accès interdit" })
  async findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.usersService.findAll(pagination, currentUser.idUsine);
  }

  @Post()
  @RequireAdmin()
  @ApiOperation({ summary: "Créer un nouvel utilisateur" })
  @ApiResponse({ status: 201, description: "Utilisateur créé avec succès" })
  @ApiResponse({
    status: 400,
    description: "Données invalides ou login déjà utilisé",
  })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    return this.usersService.create(createUserDto, currentUser.idUsine);
  }

  @Put(":id")
  @RequireAdmin()
  @ApiOperation({ summary: "Mettre à jour un utilisateur" })
  @ApiParam({ name: "id", type: "number", description: "ID de l'utilisateur" })
  @ApiResponse({
    status: 200,
    description: "Utilisateur mis à jour avec succès",
  })
  @ApiResponse({ status: 404, description: "Utilisateur non trouvé" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: RequestUser
  ) {
    await this.usersService.update(id, updateUserDto, currentUser.idUsine);
    return { message: "Utilisateur mis à jour avec succès" };
  }
}
