import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { Badge, User, ZoneControle } from "../../entities";
import { transformUser } from "../users/users.service";
import {
  AssignBadgeToUserDto,
  AssignBadgeToZoneDto,
  CreateBadgeDto,
} from "./dto";

@Injectable()
export class BadgeService {
  constructor(
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ZoneControle)
    private readonly zoneRepository: Repository<ZoneControle>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Récupérer les badges affectés à un utilisateur par usine
   */
  async findByUser(
    userId: number,
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Badge> | Badge[]> {
    try {
      const whereCondition = {
        userId,
        idUsine,
        isEnabled: true,
      };

      if (!pagination) {
        return this.badgeRepository.find({
          where: whereCondition,
          order: { Id: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [badges, total] = await this.badgeRepository.findAndCount({
        where: whereCondition,
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(badges, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des badges par utilisateur",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les badges affectés à une zone par usine
   */
  async findByZone(
    zoneId: number,
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Badge> | Badge[]> {
    try {
      const whereCondition = {
        zoneId,
        idUsine,
        isEnabled: true,
      };

      if (!pagination) {
        return this.badgeRepository.find({
          where: whereCondition,
          order: { Id: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [badges, total] = await this.badgeRepository.findAndCount({
        where: whereCondition,
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(badges, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des badges par zone",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer tous les badges affectés à des utilisateurs par usine
   */
  async findAllAssignedToUsers(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Badge> | Badge[]> {
    try {
      const queryBuilder = this.badgeRepository
        .createQueryBuilder("badge")
        .leftJoinAndSelect("badge.user", "user", "user.Id = badge.userId")
        .where("badge.idUsine = :idUsine", { idUsine })
        .andWhere("badge.userId IS NOT NULL")
        .orderBy("badge.Id", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [badges, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(badges, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des badges affectés à des utilisateurs",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer tous les badges affectés à des zones par usine
   */
  async findAllAssignedToZones(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Badge> | Badge[]> {
    try {
      const queryBuilder = this.badgeRepository
        .createQueryBuilder("badge")
        .leftJoinAndSelect("badge.zone", "zone", "zone.Id = badge.zoneId")
        .where("badge.idUsine = :idUsine", { idUsine })
        .andWhere("badge.zoneId IS NOT NULL")
        .orderBy("badge.Id", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [badges, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(badges, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des badges affectés à des zones",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les badges non affectés par usine
   */
  async findUnassigned(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Badge> | Badge[]> {
    try {
      const whereCondition = {
        userId: IsNull(),
        zoneId: IsNull(),
        idUsine,
      };

      if (!pagination) {
        return this.badgeRepository.find({
          where: whereCondition,
          order: { Id: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [badges, total] = await this.badgeRepository.findAndCount({
        where: whereCondition,
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(badges, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des badges non affectés",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Créer un nouveau badge
   */
  async create(createDto: CreateBadgeDto): Promise<{ id: number }> {
    try {
      // Vérifier l'unicité de l'UID
      const existing = await this.badgeRepository.findOne({
        where: { uid: createDto.uid },
      });

      if (existing) {
        throw new ConflictException(
          `Un badge avec l'UID ${createDto.uid} existe déjà`
        );
      }

      // Vérifier qu'on n'affecte pas à user ET zone en même temps
      if (createDto.userId && createDto.zoneId) {
        throw new BadRequestException(
          "Un badge ne peut pas être affecté à un utilisateur ET une zone en même temps"
        );
      }

      const badge = this.badgeRepository.create({
        uid: createDto.uid,
        userId: createDto.userId || null,
        zoneId: createDto.zoneId || null,
        idUsine: createDto.idUsine,
        isEnabled: true,
      });

      const saved = await this.badgeRepository.save(badge);

      this.logger.log(
        `Badge créé: ${saved.uid} (ID: ${saved.Id})`,
        "BadgeService"
      );

      return { id: saved.Id };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création du badge",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Affecter un badge à un utilisateur
   */
  async assignToUser(id: number, dto: AssignBadgeToUserDto): Promise<void> {
    try {
      const badge = await this.badgeRepository.findOne({
        where: { Id: id },
      });

      if (!badge) {
        throw new NotFoundException(`Badge avec l'ID ${id} non trouvé`);
      }

      if (badge.zoneId) {
        throw new BadRequestException(
          "Ce badge est déjà affecté à une zone. Retirez d'abord l'affectation."
        );
      }

      await this.badgeRepository.update(id, { userId: dto.userId });

      this.logger.log(
        `Badge ${id} affecté à l'utilisateur ${dto.userId}`,
        "BadgeService"
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de l'affectation du badge à l'utilisateur",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Affecter un badge à une zone
   */
  async assignToZone(id: number, dto: AssignBadgeToZoneDto): Promise<void> {
    try {
      const badge = await this.badgeRepository.findOne({
        where: { Id: id },
      });

      if (!badge) {
        throw new NotFoundException(`Badge avec l'ID ${id} non trouvé`);
      }

      if (badge.userId) {
        throw new BadRequestException(
          "Ce badge est déjà affecté à un utilisateur. Retirez d'abord l'affectation."
        );
      }

      await this.badgeRepository.update(id, { zoneId: dto.zoneId });

      this.logger.log(
        `Badge ${id} affecté à la zone ${dto.zoneId}`,
        "BadgeService"
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de l'affectation du badge à la zone",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Retirer l'affectation d'un badge
   */
  async unassign(id: number): Promise<void> {
    try {
      const badge = await this.badgeRepository.findOne({
        where: { Id: id },
      });

      if (!badge) {
        throw new NotFoundException(`Badge avec l'ID ${id} non trouvé`);
      }

      await this.badgeRepository.update(id, {
        userId: null,
        zoneId: null,
      });

      this.logger.log(`Affectation retirée du badge ${id}`, "BadgeService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors du retrait de l'affectation du badge",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Désactiver un badge
   */
  async changeEnable(id: number): Promise<void> {
    try {
      const badge = await this.badgeRepository.findOne({
        where: { Id: id },
      });

      if (!badge) {
        throw new NotFoundException(`Badge avec l'ID ${id} non trouvé`);
      }

      const newStatus = !badge.isEnabled;

      await this.badgeRepository.update(id, { isEnabled: newStatus });

      this.logger.log(
        `Badge ${id} ${newStatus ? "activé" : "désactivé"}`,
        "BadgeService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la désactivation/activation du badge`,
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Supprimer un badge
   */
  async delete(id: number): Promise<void> {
    try {
      const badge = await this.badgeRepository.findOne({
        where: { Id: id },
      });

      if (!badge) {
        throw new NotFoundException(`Badge avec l'ID ${id} non trouvé`);
      }

      await this.badgeRepository.delete(id);

      this.logger.log(`Badge ${id} supprimé`, "BadgeService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du badge",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les zones non affectées à un badge par usine
   */
  async findZonesWithoutBadge(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ZoneControle> | ZoneControle[]> {
    try {
      const queryBuilder = this.zoneRepository
        .createQueryBuilder("zone")
        .leftJoin(
          Badge,
          "badge",
          "badge.zoneId = zone.Id AND badge.isEnabled = 1"
        )
        .where("zone.idUsine = :idUsine", { idUsine })
        .andWhere("badge.Id IS NULL")
        .orderBy("zone.nom", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [zones, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(zones, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des zones sans badge",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les utilisateurs non affectés à un badge par usine
   */
  async findUsersWithoutBadge(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Partial<User>> | Partial<User>[]> {
    try {
      const queryBuilder = this.userRepository
        .createQueryBuilder("user")
        .select([
          "user.Id",
          "user.Nom",
          "user.Prenom",
          "user.login",
          "user.email",
          "user.isActif",
        ])
        .leftJoin(
          Badge,
          "badge",
          "badge.userId = user.Id AND badge.isEnabled = 1"
        )
        .where("user.idUsine = :idUsine", { idUsine })
        .andWhere("user.isActif = 1")
        .andWhere("badge.Id IS NULL")
        .orderBy("user.Nom", "ASC");

      if (!pagination) {
        const users = await queryBuilder.getMany();
        return users.map(user => transformUser(user));
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [users, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();
      const transformedUsers = users.map(user => transformUser(user));
      return createPaginatedResult(transformedUsers, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des utilisateurs sans badge",
        error instanceof Error ? error.stack : String(error),
        "BadgeService"
      );
      throw error;
    }
  }
}
