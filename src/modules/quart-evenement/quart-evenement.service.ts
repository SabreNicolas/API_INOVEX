import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenement } from "../../entities";
import { CreateQuartEvenementDto, UpdateQuartEvenementDto } from "./dto";

@Injectable()
export class QuartEvenementService {
  constructor(
    @InjectRepository(QuartEvenement)
    private readonly quartEvenementRepository: Repository<QuartEvenement>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartEvenement> | QuartEvenement[]> {
    try {
      const whereCondition = { idUsine, isActive: 1 };

      if (!pagination) {
        return this.quartEvenementRepository.find({
          where: whereCondition,
          order: { id: "DESC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [evenements, total] =
        await this.quartEvenementRepository.findAndCount({
          where: whereCondition,
          order: { id: "DESC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(evenements, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des événements",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartEvenement> {
    try {
      const evenement = await this.quartEvenementRepository.findOne({
        where: { id, idUsine },
      });

      if (!evenement) {
        throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
      }

      return evenement;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateQuartEvenementDto,
    idUsine: number,
    fileUrl?: string
  ): Promise<{ id: number }> {
    try {
      const evenement = this.quartEvenementRepository.create({
        titre: createDto.titre,
        description: createDto.description,
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
        groupementGMAO: createDto.groupementGMAO || null,
        equipementGMAO: createDto.equipementGMAO || null,
        importance: createDto.importance ?? 1,
        demande_travaux: createDto.demande_travaux ?? "0",
        consigne: createDto.consigne ?? 0,
        cause: createDto.cause || null,
        url: fileUrl || createDto.url || null,
        idUsine,
        isActive: 1,
      });

      const saved = await this.quartEvenementRepository.save(evenement);

      this.logger.log(
        `Événement créé: ${saved.titre} (ID: ${saved.id})`,
        "QuartEvenementService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartEvenementDto
  ): Promise<void> {
    try {
      const existing = await this.quartEvenementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<QuartEvenement> = {};

      if (updateDto.titre !== undefined) updateData.titre = updateDto.titre;
      if (updateDto.description !== undefined)
        updateData.description = updateDto.description;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.groupementGMAO !== undefined)
        updateData.groupementGMAO = updateDto.groupementGMAO;
      if (updateDto.equipementGMAO !== undefined)
        updateData.equipementGMAO = updateDto.equipementGMAO;
      if (updateDto.importance !== undefined)
        updateData.importance = updateDto.importance;
      if (updateDto.demande_travaux !== undefined)
        updateData.demande_travaux = updateDto.demande_travaux;
      if (updateDto.consigne !== undefined)
        updateData.consigne = updateDto.consigne;
      if (updateDto.cause !== undefined) updateData.cause = updateDto.cause;
      if (updateDto.url !== undefined) updateData.url = updateDto.url;
      if (updateDto.isActive !== undefined)
        updateData.isActive = updateDto.isActive;

      if (Object.keys(updateData).length > 0) {
        await this.quartEvenementRepository.update(id, updateData);
      }

      this.logger.log(
        `Événement mis à jour: ID ${id}`,
        "QuartEvenementService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartEvenementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Événement avec l'ID ${id} non trouvé`);
      }

      await this.quartEvenementRepository.update(id, { isActive: 0 });

      this.logger.log(`Événement supprimé: ID ${id}`, "QuartEvenementService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementService"
      );
      throw error;
    }
  }
}
