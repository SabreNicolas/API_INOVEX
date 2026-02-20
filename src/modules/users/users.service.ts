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
        return users;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [users, total] = await this.userRepository.findAndCount({
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
        where: { Id: id },
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
        idUsine: idUsine || 1,
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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe
      const existing = await this.userRepository.findOne({
        where: { Id: id },
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
      if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
      if (updateUserDto.loginGMAO !== undefined) updateData.loginGMAO = updateUserDto.loginGMAO;
      if (updateUserDto.posteUser !== undefined) updateData.posteUser = updateUserDto.posteUser;
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

  async delete(id: number, currentUserId: number): Promise<void> {
    try {
      // Empêcher la suppression de son propre compte
      if (id === currentUserId) {
        throw new BadRequestException(
          "Vous ne pouvez pas supprimer votre propre compte"
        );
      }

      const existing = await this.userRepository.findOne({
        where: { Id: id },
        select: ["Id"],
      });

      if (!existing) {
        throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
      }

      // Désactivation au lieu de suppression (pas de deletedAt dans le schéma)
      await this.userRepository.update({ Id: id }, { isActif: false });

      this.logger.log(
        `Utilisateur ${id} désactivé`,
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
        where: { Id: id },
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
