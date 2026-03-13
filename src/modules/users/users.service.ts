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
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<
    PaginatedResult<Record<string, unknown>> | Record<string, unknown>[]
  > {
    try {
      const whereCondition = idUsine ? { idUsine } : {};

      // Si pas de pagination, retourner tous les résultats (rétrocompatibilité) avec limite de sécurité
      if (!pagination) {
        const users = await this.userRepository.find({
          where: whereCondition,
          select: [
            "Id",
            "login",
            "Nom",
            "Prenom",
            "email",
            "loginGMAO",
            "posteUser",
            "isAdmin",
            "isRondier",
            "isSaisie",
            "isQSE",
            "isRapport",
            "isChefQuart",
            "isSuperAdmin",
            "isMail",
            "isActif",
            "idUsine",
          ],
          order: { Id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        return users.map(user => transformUser(user));
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [users, total] = await this.userRepository.findAndCount({
        where: whereCondition,
        select: [
          "Id",
          "login",
          "Nom",
          "Prenom",
          "email",
          "loginGMAO",
          "posteUser",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
          "isMail",
          "isActif",
          "idUsine",
        ],
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
      });

      const transformedUsers = users.map(user => transformUser(user));
      return createPaginatedResult(transformedUsers, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des utilisateurs",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async findOne(
    id: number,
    idUsine?: number
  ): Promise<Record<string, unknown>> {
    try {
      const whereCondition: { Id: number; idUsine?: number } = { Id: id };
      if (idUsine) {
        whereCondition.idUsine = idUsine;
      }

      const user = await this.userRepository.findOne({
        where: whereCondition,
        select: [
          "Id",
          "login",
          "Nom",
          "Prenom",
          "email",
          "loginGMAO",
          "posteUser",
          "isAdmin",
          "isRondier",
          "isSaisie",
          "isQSE",
          "isRapport",
          "isChefQuart",
          "isSuperAdmin",
          "isMail",
          "isActif",
          "idUsine",
        ],
      });

      if (!user) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      return transformUser(user);
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

  async create(
    createUserDto: CreateUserDto,
    currentUserIdUsine?: number
  ): Promise<{ id: number }> {
    const {
      login,
      password,
      nom,
      prenom,
      email,
      loginGMAO,
      posteUser,
      isAdmin,
      isRondier,
      isSaisie,
      isQSE,
      isRapport,
      isChefQuart,
      isSuperAdmin,
      isMail,
      isActif,
      idUsine,
    } = createUserDto;

    try {
      // Vérifier si le login existe déjà
      const existing = await this.userRepository.findOne({
        where: { login },
        select: ["Id"],
      });

      if (existing) {
        throw new BadRequestException("Ce login est déjà utilisé");
      }

      // Hasher le mot de passe
      const hashedPassword = await argon2.hash(password);

      // Utiliser l'idUsine du DTO si fourni, sinon celui de l'utilisateur courant, sinon 1
      const finalIdUsine = idUsine ?? currentUserIdUsine ?? 1;

      const user = this.userRepository.create({
        login,
        pwd: hashedPassword,
        Nom: nom,
        Prenom: prenom,
        email: email || "",
        loginGMAO: loginGMAO || "",
        posteUser: posteUser || "",
        isAdmin: isAdmin || false,
        isRondier: isRondier || false,
        isSaisie: isSaisie || false,
        isQSE: isQSE || false,
        isRapport: isRapport || false,
        isChefQuart: isChefQuart || false,
        isSuperAdmin: isSuperAdmin || false,
        isMail: isMail || false,
        isActif: isActif !== undefined ? isActif : true,
        idUsine: finalIdUsine,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.log(`Utilisateur créé: ${login}`, "UsersService");

      return { id: savedUser.Id };
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

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    idUsine?: number
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe (et appartient au même site si idUsine spécifié)
      const whereCondition: { Id: number; idUsine?: number } = { Id: id };
      if (idUsine) {
        whereCondition.idUsine = idUsine;
      }

      const existing = await this.userRepository.findOne({
        where: whereCondition,
        select: ["Id", "login"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Si le login change, vérifier qu'il n'est pas déjà utilisé
      if (updateUserDto.login && updateUserDto.login !== existing.login) {
        const loginCheck = await this.userRepository.findOne({
          where: { login: updateUserDto.login, Id: Not(id) },
          select: ["Id"],
        });

        if (loginCheck) {
          throw new BadRequestException("Ce login est déjà utilisé");
        }
      }

      // Construire l'objet de mise à jour
      const updateData: Partial<User> = {};

      if (updateUserDto.login) updateData.login = updateUserDto.login;
      if (updateUserDto.nom) updateData.Nom = updateUserDto.nom;
      if (updateUserDto.prenom) updateData.Prenom = updateUserDto.prenom;
      if (updateUserDto.email !== undefined)
        updateData.email = updateUserDto.email;
      if (updateUserDto.loginGMAO !== undefined)
        updateData.loginGMAO = updateUserDto.loginGMAO;
      if (updateUserDto.posteUser !== undefined)
        updateData.posteUser = updateUserDto.posteUser;
      if (updateUserDto.password) {
        updateData.pwd = await argon2.hash(updateUserDto.password);
      }
      if (updateUserDto.isAdmin !== undefined)
        updateData.isAdmin = updateUserDto.isAdmin;
      if (updateUserDto.isRondier !== undefined)
        updateData.isRondier = updateUserDto.isRondier;
      if (updateUserDto.isSaisie !== undefined)
        updateData.isSaisie = updateUserDto.isSaisie;
      if (updateUserDto.isQSE !== undefined)
        updateData.isQSE = updateUserDto.isQSE;
      if (updateUserDto.isRapport !== undefined)
        updateData.isRapport = updateUserDto.isRapport;
      if (updateUserDto.isChefQuart !== undefined)
        updateData.isChefQuart = updateUserDto.isChefQuart;
      if (updateUserDto.isSuperAdmin !== undefined)
        updateData.isSuperAdmin = updateUserDto.isSuperAdmin;
      if (updateUserDto.isMail !== undefined)
        updateData.isMail = updateUserDto.isMail;
      if (updateUserDto.isActif !== undefined)
        updateData.isActif = updateUserDto.isActif;
      if (updateUserDto.idUsine !== undefined)
        updateData.idUsine = updateUserDto.idUsine;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("Aucune donnée à mettre à jour");
      }

      await this.userRepository.update({ Id: id }, updateData);

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

  async delete(
    id: number,
    currentUserId: number,
    idUsine?: number
  ): Promise<void> {
    try {
      // Empêcher la suppression de son propre compte
      if (id === currentUserId) {
        throw new BadRequestException(
          "Vous ne pouvez pas supprimer votre propre compte"
        );
      }

      const whereCondition: { Id: number; idUsine?: number } = { Id: id };
      if (idUsine) {
        whereCondition.idUsine = idUsine;
      }

      const existing = await this.userRepository.findOne({
        where: whereCondition,
        select: ["Id"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Désactivation au lieu de suppression (pas de deletedAt dans le schéma)
      await this.userRepository.update({ Id: id }, { isActif: false });

      this.logger.log(`Utilisateur ${id} désactivé`, "UsersService");
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

  async findWithEmail(idUsine?: number): Promise<Record<string, unknown>[]> {
    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder("user")
        .select([
          "user.Id",
          "user.login",
          "user.Nom",
          "user.Prenom",
          "user.email",
          "user.loginGMAO",
          "user.posteUser",
          "user.isAdmin",
          "user.isRondier",
          "user.isSaisie",
          "user.isQSE",
          "user.isRapport",
          "user.isChefQuart",
          "user.isSuperAdmin",
          "user.isMail",
          "user.isActif",
          "user.idUsine",
        ])
        .where("LEN(user.email) > 0")
        .orderBy("user.Nom", "ASC");

      if (idUsine) {
        queryBuilder.andWhere("user.idUsine = :idUsine", { idUsine });
      }

      const users = await queryBuilder.getMany();
      return users.map(user => transformUser(user));
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des utilisateurs avec email",
        error instanceof Error ? error.stack : String(error),
        "UsersService"
      );
      throw error;
    }
  }

  async restore(id: number, idUsine?: number): Promise<void> {
    try {
      const whereCondition: { Id: number; idUsine?: number } = { Id: id };
      if (idUsine) {
        whereCondition.idUsine = idUsine;
      }

      const existing = await this.userRepository.findOne({
        where: whereCondition,
        select: ["Id", "isActif"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      if (existing.isActif) {
        throw new BadRequestException(`L'utilisateur ${id} est déjà actif`);
      }

      await this.userRepository.update({ Id: id }, { isActif: true });

      this.logger.log(`Utilisateur ${id} réactivé`, "UsersService");
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

/**
 * Transforme un utilisateur pour renvoyer id, nom, prenom en minuscules
 */
export function transformUser(
  user: Omit<User, "pwd">
): Record<string, unknown> {
  return {
    id: user.Id,
    login: user.login,
    nom: user.Nom,
    prenom: user.Prenom,
    email: user.email,
    loginGMAO: user.loginGMAO,
    posteUser: user.posteUser,
    isAdmin: user.isAdmin,
    isRondier: user.isRondier,
    isSaisie: user.isSaisie,
    isQSE: user.isQSE,
    isRapport: user.isRapport,
    isChefQuart: user.isChefQuart,
    isSuperAdmin: user.isSuperAdmin,
    isMail: user.isMail,
    isActif: user.isActif,
    idUsine: user.idUsine,
  };
}
