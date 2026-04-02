import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { Anomalie } from "../../entities";
import { CreateAnomalieDto, UpdateAnomalieDto } from "./dto";

@Injectable()
export class AnomalieService {
  constructor(
    @InjectRepository(Anomalie)
    private readonly anomalieRepository: Repository<Anomalie>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Anomalie> | Anomalie[]> {
    try {
      if (!pagination) {
        return this.anomalieRepository.find({
          relations: ["ronde", "zone"],
          where: { zone: { idUsine } },
          order: { id: "DESC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [anomalies, total] = await this.anomalieRepository.findAndCount({
        relations: ["ronde", "zone"],
        where: { zone: { idUsine } },
        order: { id: "DESC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(anomalies, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des anomalies",
        error instanceof Error ? error.stack : String(error),
        "AnomalieService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Anomalie> {
    try {
      const anomalie = await this.anomalieRepository.findOne({
        where: { id },
        relations: ["ronde", "zone"],
      });

      if (!anomalie) {
        throw new NotFoundException(`Anomalie avec l'ID ${id} non trouvée`);
      }

      return anomalie;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'anomalie",
        error instanceof Error ? error.stack : String(error),
        "AnomalieService"
      );
      throw error;
    }
  }

  async create(createDto: CreateAnomalieDto): Promise<{ id: number }> {
    try {
      const anomalie = this.anomalieRepository.create({
        rondeId: createDto.rondeId ?? null,
        zoneId: createDto.zoneId ?? null,
        commentaire: createDto.commentaire || null,
        photo: createDto.photo || null,
        evenement: createDto.evenement ?? 0,
      });

      const saved = await this.anomalieRepository.save(anomalie);

      this.logger.log(`Anomalie créée (ID: ${saved.id})`, "AnomalieService");

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'anomalie",
        error instanceof Error ? error.stack : String(error),
        "AnomalieService"
      );
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateAnomalieDto): Promise<void> {
    try {
      const existing = await this.anomalieRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Anomalie avec l'ID ${id} non trouvée`);
      }

      const updateData: Partial<Anomalie> = {};

      if (updateDto.rondeId !== undefined)
        updateData.rondeId = updateDto.rondeId;
      if (updateDto.zoneId !== undefined) updateData.zoneId = updateDto.zoneId;
      if (updateDto.commentaire !== undefined)
        updateData.commentaire = updateDto.commentaire;
      if (updateDto.photo !== undefined) updateData.photo = updateDto.photo;
      if (updateDto.evenement !== undefined)
        updateData.evenement = updateDto.evenement;

      if (Object.keys(updateData).length > 0) {
        await this.anomalieRepository.update(id, updateData);
      }

      this.logger.log(`Anomalie mise à jour: ID ${id}`, "AnomalieService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'anomalie",
        error instanceof Error ? error.stack : String(error),
        "AnomalieService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.anomalieRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Anomalie avec l'ID ${id} non trouvée`);
      }

      await this.anomalieRepository.delete(id);

      this.logger.log(`Anomalie supprimée: ID ${id}`, "AnomalieService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'anomalie",
        error instanceof Error ? error.stack : String(error),
        "AnomalieService"
      );
      throw error;
    }
  }
}
