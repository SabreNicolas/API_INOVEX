import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { Not, Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "../../common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { User } from "../../entities";
import { CreateUserDto, UpdateUserDto } from "./dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Omit<User, "pwd">> | Omit<User, "pwd">[]> {
    try {
      // Si pas de pagination, retourner tous les résultats (rétrocompatibilité) avec limite de sécurité
      if (!pagination) {
        const users = await this.userRepository.find({
          select: [
            "id",
            "login",
            "nom",
            "prenom",
            "isAdmin",
            "isVeto",
            "isEditeur",
            "isLecteur",
          ],
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        return users;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [users, total] = await this.userRepository.findAndCount({
        select: [
          "id",
          "login",
          "nom",
          "prenom",
          "isAdmin",
          "isVeto",
          "isEditeur",
          "isLecteur",
        ],
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(users, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des utilisateurs",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Omit<User, "pwd">> {
    try {
      const user = await this.userRepository.findOne({
        where: { id },
        select: [
          "id",
          "login",
          "nom",
          "prenom",
          "isAdmin",
          "isVeto",
          "isEditeur",
          "isLecteur",
        ],
      });

      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async create(createUserDto: CreateUserDto): Promise<{ id: number }> {
    const {
      login,
      password,
      nom,
      prenom,
      isAdmin,
      isVeto,
      isEditeur,
      isLecteur,
    } = createUserDto;

    try {
      // Vérifier si le login existe déjà
      const existing = await this.userRepository.findOne({
        where: { login },
        select: ["id"],
      });

      if (existing) {
        throw new BadRequestException("Ce login est déjà utilisé");
      }

      // Hasher le mot de passe
      const hashedPassword = await argon2.hash(password);

      const user = this.userRepository.create({
        login,
        pwd: hashedPassword,
        nom,
        prenom,
        isAdmin: isAdmin || false,
        isVeto: isVeto || false,
        isEditeur: isEditeur || false,
        isLecteur: isLecteur || false,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.log(`Utilisateur créé: ${login}`, "UsersService");

      return { id: savedUser.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création de l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe
      const existing = await this.userRepository.findOne({
        where: { id },
        select: ["id", "login"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Si le login change, vérifier qu'il n'est pas déjà utilisé
      if (updateUserDto.login && updateUserDto.login !== existing.login) {
        const loginCheck = await this.userRepository.findOne({
          where: { login: updateUserDto.login, id: Not(id) },
          select: ["id"],
        });

        if (loginCheck) {
          throw new BadRequestException("Ce login est déjà utilisé");
        }
      }

      // Construire l'objet de mise à jour
      const updateData: Partial<User> = {};

      if (updateUserDto.login) updateData.login = updateUserDto.login;
      if (updateUserDto.nom) updateData.nom = updateUserDto.nom;
      if (updateUserDto.prenom) updateData.prenom = updateUserDto.prenom;
      if (updateUserDto.password) {
        updateData.pwd = await argon2.hash(updateUserDto.password);
      }
      if (updateUserDto.isAdmin !== undefined)
        updateData.isAdmin = updateUserDto.isAdmin;
      if (updateUserDto.isVeto !== undefined)
        updateData.isVeto = updateUserDto.isVeto;
      if (updateUserDto.isEditeur !== undefined)
        updateData.isEditeur = updateUserDto.isEditeur;
      if (updateUserDto.isLecteur !== undefined)
        updateData.isLecteur = updateUserDto.isLecteur;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("Aucune donnée à mettre à jour");
      }

      await this.userRepository.update(id, updateData);

      this.logger.log(`Utilisateur ${id} mis à jour`, "UsersService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    try {
      // Empêcher la suppression de son propre compte
      if (id === currentUserId) {
        throw new BadRequestException(
          "Vous ne pouvez pas supprimer votre propre compte"
        );
      }

      const existing = await this.userRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      await this.userRepository.softDelete(id);

      this.logger.log(
        `Utilisateur ${id} supprimé (soft delete)`,
        "UsersService"
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async restore(id: number): Promise<void> {
    try {
      const existing = await this.userRepository.findOne({
        where: { id },
        withDeleted: true,
        select: ["id", "deletedAt"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      if (!existing.deletedAt) {
        throw new BadRequestException(`L'utilisateur ${id} n'est pas supprimé`);
      }

      await this.userRepository.restore(id);

      this.logger.log(`Utilisateur ${id} restauré`, "UsersService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la restauration de l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }
}
