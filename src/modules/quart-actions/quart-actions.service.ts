import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { ActionEnregistrement, QuartAction } from "../../entities";
import { CreateQuartActionDto, UpdateQuartActionDto } from "./dto";

@Injectable()
export class QuartActionsService {
  constructor(
    @InjectRepository(QuartAction)
    private readonly quartActionRepository: Repository<QuartAction>,
    @InjectRepository(ActionEnregistrement)
    private readonly actionEnregistrementRepository: Repository<ActionEnregistrement>,
    private readonly logger: LoggerService
  ) {}

  async findAllEnregistrements(
    idUsine: number
  ): Promise<ActionEnregistrement[]> {
    try {
      return this.actionEnregistrementRepository.find({
        where: { idUsine },
        order: { nom: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions enregistrement",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartAction> | QuartAction[]> {
    try {
      const whereCondition = { idUsine };

      if (!pagination) {
        return this.quartActionRepository.find({
          where: whereCondition,
          order: { date_heure_debut: "DESC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actions, total] = await this.quartActionRepository.findAndCount({
        where: whereCondition,
        order: { date_heure_debut: "DESC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(actions, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findActiveOnDate(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartAction> | QuartAction[]> {
    try {
      const queryBuilder = this.quartActionRepository
        .createQueryBuilder("action")
        .where("action.idUsine = :idUsine", { idUsine })
        .andWhere(
          "(action.date_heure_debut <= :date AND action.date_heure_fin >= :date)",
          { date }
        )
        .orderBy("action.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actions, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actions, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions actives sur la date",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    dateDebut: Date,
    dateFin: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartAction> | QuartAction[]> {
    try {
      const queryBuilder = this.quartActionRepository
        .createQueryBuilder("action")
        .where("action.idUsine = :idUsine", { idUsine })
        .andWhere(
          "(action.date_heure_debut BETWEEN :dateDebut AND :dateFin OR action.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (action.date_heure_debut <= :dateDebut AND action.date_heure_fin >= :dateFin))",
          { dateDebut, dateFin }
        )
        .orderBy("action.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actions, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actions, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions par plage de dates",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findFuture(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartAction> | QuartAction[]> {
    try {
      const queryBuilder = this.quartActionRepository
        .createQueryBuilder("action")
        .where("action.idUsine = :idUsine", { idUsine })
        .andWhere("action.date_heure_debut > :date", { date })
        .orderBy("action.date_heure_debut", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actions, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actions, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions à venir",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartAction> {
    try {
      const action = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!action) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      return action;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async create(
    idUsine: number,
    createDto: CreateQuartActionDto
  ): Promise<{ id: number }> {
    try {
      const action = this.quartActionRepository.create({
        nom: createDto.nom,
        idUsine,
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
      });

      const saved = await this.quartActionRepository.save(action);

      this.logger.log(
        `Action créée: ${saved.nom} (ID: ${saved.id})`,
        "QuartActionsService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartActionDto
  ): Promise<void> {
    try {
      const existing = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      const updateData: Partial<QuartAction> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);

      if (Object.keys(updateData).length > 0) {
        await this.quartActionRepository.update(id, updateData);
      }

      this.logger.log(`Action mise à jour: ID ${id}`, "QuartActionsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      await this.quartActionRepository.delete(id);

      this.logger.log(`Action supprimée: ID ${id}`, "QuartActionsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  // --- Actions Enregistrement ---

  async createEnregistrement(
    idUsine: number,
    nom: string
  ): Promise<{ id: number }> {
    try {
      const enregistrement = this.actionEnregistrementRepository.create({
        nom,
        idUsine,
      });

      const saved =
        await this.actionEnregistrementRepository.save(enregistrement);

      this.logger.log(
        `Action enregistrement créée: ${saved.nom} (ID: ${saved.id})`,
        "QuartActionsService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'action enregistrement",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async updateEnregistrement(
    id: number,
    idUsine: number,
    nom: string
  ): Promise<void> {
    try {
      const existing = await this.actionEnregistrementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Action enregistrement avec l'ID ${id} non trouvée`
        );
      }

      await this.actionEnregistrementRepository.update(id, { nom });

      this.logger.log(
        `Action enregistrement mise à jour: ID ${id}`,
        "QuartActionsService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'action enregistrement",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async deleteEnregistrement(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.actionEnregistrementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Action enregistrement avec l'ID ${id} non trouvée`
        );
      }

      await this.actionEnregistrementRepository.delete(id);

      this.logger.log(
        `Action enregistrement supprimée: ID ${id}`,
        "QuartActionsService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'action enregistrement",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }
}
