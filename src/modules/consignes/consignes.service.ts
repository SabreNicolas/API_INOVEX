import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { Consigne, ConsigneType } from "../../entities";
import { CreateConsigneDto, UpdateConsigneDto } from "./dto";

@Injectable()
export class ConsignesService {
  constructor(
    @InjectRepository(Consigne)
    private readonly consigneRepository: Repository<Consigne>,
    @InjectRepository(ConsigneType)
    private readonly consigneTypeRepository: Repository<ConsigneType>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Consigne> | Consigne[]> {
    try {
      const whereCondition = { idUsine };

      if (!pagination) {
        return this.consigneRepository.find({
          where: whereCondition,
          order: { id: "DESC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [consignes, total] = await this.consigneRepository.findAndCount({
        where: whereCondition,
        order: { id: "DESC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(consignes, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des consignes",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findActiveOnDate(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Consigne> | Consigne[]> {
    try {
      const queryBuilder = this.consigneRepository
        .createQueryBuilder("consigne")
        .leftJoinAndSelect("consigne.typeConsigne", "type")
        .where("consigne.idUsine = :idUsine", { idUsine })
        .andWhere("consigne.isActive = 1")
        .andWhere(
          "(consigne.date_heure_debut <= :date AND (consigne.date_heure_fin >= :date OR consigne.date_heure_fin IS NULL))",
          { date }
        )
        .orderBy("consigne.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [consignes, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(consignes, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des consignes actives sur la date",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    dateDebut: Date,
    dateFin: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Consigne> | Consigne[]> {
    try {
      const queryBuilder = this.consigneRepository
        .createQueryBuilder("consigne")
        .leftJoinAndSelect("consigne.type", "type", "type.Id = consigne.type")
        .where("consigne.idUsine = :idUsine", { idUsine })
        .andWhere("consigne.isActive = 1")
        .andWhere(
          "(consigne.date_heure_debut BETWEEN :dateDebut AND :dateFin OR consigne.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (consigne.date_heure_debut <= :dateDebut AND (consigne.date_heure_fin >= :dateFin OR consigne.date_heure_fin IS NULL)))",
          { dateDebut, dateFin }
        )
        .orderBy("consigne.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [consignes, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(consignes, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des consignes par plage de dates",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findInactive(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Consigne> | Consigne[]> {
    try {
      const queryBuilder = this.consigneRepository
        .createQueryBuilder("consigne")
        .leftJoinAndSelect("consigne.typeConsigne", "type")
        .where("consigne.idUsine = :idUsine", { idUsine })
        .andWhere("consigne.isActive = 1")
        .andWhere(
          "(consigne.date_heure_debut > :date OR consigne.date_heure_fin < :date)",
          { date }
        )
        .orderBy("consigne.date_heure_debut", "DESC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [consignes, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(consignes, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des consignes inactives",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findFuture(
    idUsine: number,
    date: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Consigne> | Consigne[]> {
    try {
      const queryBuilder = this.consigneRepository
        .createQueryBuilder("consigne")
        .leftJoinAndSelect("consigne.typeConsigne", "type")
        .where("consigne.idUsine = :idUsine", { idUsine })
        .andWhere("consigne.isActive = 1")
        .andWhere("consigne.date_heure_debut > :date", { date })
        .orderBy("consigne.date_heure_debut", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [consignes, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(consignes, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des consignes à venir",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<Consigne> {
    try {
      const consigne = await this.consigneRepository.findOne({
        where: { id, idUsine },
      });

      if (!consigne) {
        throw new NotFoundException(`Consigne avec l'ID ${id} non trouvée`);
      }

      return consigne;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de la consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateConsigneDto,
    fileUrl?: string
  ): Promise<{ id: number }> {
    try {
      const consigne = this.consigneRepository.create({
        titre: createDto.titre,
        commentaire: createDto.description || null,
        date_heure_debut: createDto.date_heure_debut
          ? new Date(createDto.date_heure_debut)
          : null,
        date_heure_fin: createDto.date_heure_fin
          ? new Date(createDto.date_heure_fin)
          : null,
        type: createDto.type || null,
        url: fileUrl || createDto.url || null,
        idUsine: createDto.idUsine,
        isActive: 1,
      });

      const saved = await this.consigneRepository.save(consigne);

      this.logger.log(
        `Consigne créée: ${saved.titre} (ID: ${saved.id})`,
        "ConsignesService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateConsigneDto,
    fileUrl?: string,
    fileUploadService?: FileUploadService
  ): Promise<void> {
    try {
      const existing = await this.consigneRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Consigne avec l'ID ${id} non trouvée`);
      }

      const updateData: Partial<Consigne> = {};

      if (updateDto.titre !== undefined) updateData.titre = updateDto.titre;
      if (updateDto.description !== undefined)
        updateData.commentaire = updateDto.description;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.type !== undefined) updateData.type = updateDto.type;
      if (updateDto.isActive !== undefined)
        updateData.isActive = updateDto.isActive;

      // Handle file upload
      if (fileUrl) {
        // Delete old file if exists
        if (existing.url && fileUploadService) {
          fileUploadService.deleteFile(existing.url);
        }
        updateData.url = fileUrl;
      } else if (updateDto.url !== undefined) {
        updateData.url = updateDto.url;
      }

      if (Object.keys(updateData).length > 0) {
        await this.consigneRepository.update(id, updateData);
      }

      this.logger.log(`Consigne mise à jour: ID ${id}`, "ConsignesService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de la consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.consigneRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Consigne avec l'ID ${id} non trouvée`);
      }

      await this.consigneRepository.delete(id);

      this.logger.log(`Consigne supprimée: ID ${id}`, "ConsignesService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de la consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async deactivate(id: number): Promise<void> {
    try {
      const existing = await this.consigneRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Consigne avec l'ID ${id} non trouvée`);
      }

      await this.consigneRepository.update(id, { isActive: 0 });

      this.logger.log(`Consigne désactivée: ID ${id}`, "ConsignesService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la désactivation de la consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async removeFile(
    id: number,
    fileUploadService: FileUploadService
  ): Promise<void> {
    try {
      const existing = await this.consigneRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Consigne avec l'ID ${id} non trouvée`);
      }

      if (existing.url) {
        fileUploadService.deleteFile(existing.url);
        await this.consigneRepository.update(id, { url: null });
        this.logger.log(
          `Fichier supprimé pour consigne: ID ${id}`,
          "ConsignesService"
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du fichier",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }

  async findTypes(): Promise<ConsigneType[]> {
    try {
      return this.consigneTypeRepository.find({
        order: { nom: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des types de consigne",
        error instanceof Error ? error.stack : String(error),
        "ConsignesService"
      );
      throw error;
    }
  }
}
