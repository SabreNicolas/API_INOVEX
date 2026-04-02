import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { QuartActualite } from "../../entities";
import { CreateQuartActualiteDto, UpdateQuartActualiteDto } from "./dto";

@Injectable()
export class QuartActualiteService {
  constructor(
    @InjectRepository(QuartActualite)
    private readonly quartActualiteRepository: Repository<QuartActualite>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartActualite> | QuartActualite[]> {
    try {
      const whereCondition = { idUsine, isActive: 1 };

      if (!pagination) {
        return this.quartActualiteRepository.find({
          where: whereCondition,
          order: { id: "DESC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actualites, total] =
        await this.quartActualiteRepository.findAndCount({
          where: whereCondition,
          order: { id: "DESC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(actualites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actualités",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async findActiveOnDate(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartActualite> | QuartActualite[]> {
    try {
      const queryBuilder = this.quartActualiteRepository
        .createQueryBuilder("actualite")
        .where("actualite.idUsine = :idUsine", { idUsine })
        .andWhere("actualite.isActive = 1")
        .andWhere(
          "(actualite.date_heure_debut <= :date AND (actualite.date_heure_fin >= :date OR actualite.date_heure_fin IS NULL))",
          { date }
        )
        .orderBy("actualite.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actualites, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actualites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actualités actives sur la date",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    dateDebut: Date,
    dateFin: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartActualite> | QuartActualite[]> {
    try {
      const queryBuilder = this.quartActualiteRepository
        .createQueryBuilder("actualite")
        .where("actualite.idUsine = :idUsine", { idUsine })
        .andWhere("actualite.isActive = 1")
        .andWhere(
          "(actualite.date_heure_debut BETWEEN :dateDebut AND :dateFin OR actualite.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (actualite.date_heure_debut <= :dateDebut AND (actualite.date_heure_fin >= :dateFin OR actualite.date_heure_fin IS NULL)))",
          { dateDebut, dateFin }
        )
        .orderBy("actualite.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actualites, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actualites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actualités par plage de dates",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async findInactive(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartActualite> | QuartActualite[]> {
    try {
      const queryBuilder = this.quartActualiteRepository
        .createQueryBuilder("actualite")
        .where("actualite.idUsine = :idUsine", { idUsine })
        .andWhere("actualite.isActive = 1")
        .andWhere(
          "(actualite.date_heure_debut > :date OR actualite.date_heure_fin < :date)",
          { date }
        )
        .orderBy("actualite.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actualites, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actualites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actualités inactives",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async findFuture(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartActualite> | QuartActualite[]> {
    try {
      const queryBuilder = this.quartActualiteRepository
        .createQueryBuilder("actualite")
        .where("actualite.idUsine = :idUsine", { idUsine })
        .andWhere("actualite.isActive = 1")
        .andWhere("actualite.date_heure_debut > :date", { date })
        .orderBy("actualite.date_heure_debut", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [actualites, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(actualites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actualités à venir",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartActualite> {
    try {
      const actualite = await this.quartActualiteRepository.findOne({
        where: { id, idUsine },
      });

      if (!actualite) {
        throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
      }

      return actualite;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'actualité",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateQuartActualiteDto,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const actualite = this.quartActualiteRepository.create({
        titre: createDto.titre,
        description: createDto.description || null,
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
        importance: createDto.importance ?? 1,
        isQuart: createDto.isQuart ?? 0,
        isActive: 1,
        idUsine,
      });

      const saved = await this.quartActualiteRepository.save(actualite);

      this.logger.log(
        `Actualité créée: ${saved.titre} (ID: ${saved.id})`,
        "QuartActualiteService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'actualité",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartActualiteDto
  ): Promise<void> {
    try {
      const existing = await this.quartActualiteRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
      }

      const updateData: Partial<QuartActualite> = {};

      if (updateDto.titre !== undefined) updateData.titre = updateDto.titre;
      if (updateDto.description !== undefined)
        updateData.description = updateDto.description;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.importance !== undefined)
        updateData.importance = updateDto.importance;
      if (updateDto.isQuart !== undefined)
        updateData.isQuart = updateDto.isQuart;

      if (Object.keys(updateData).length > 0) {
        await this.quartActualiteRepository.update(id, updateData);
      }

      this.logger.log(
        `Actualité mise à jour: ID ${id}`,
        "QuartActualiteService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'actualité",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartActualiteRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Actualité avec l'ID ${id} non trouvée`);
      }

      await this.quartActualiteRepository.update(id, { isActive: 0 });

      this.logger.log(`Actualité supprimée: ID ${id}`, "QuartActualiteService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'actualité",
        error instanceof Error ? error.stack : String(error),
        "QuartActualiteService"
      );
      throw error;
    }
  }
}
