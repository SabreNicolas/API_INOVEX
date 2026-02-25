import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { ZoneControle } from "../../entities";
import { CreateZoneControleDto, UpdateZoneControleDto } from "./dto";

@Injectable()
export class ZoneControleService {
  constructor(
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ZoneControle> | ZoneControle[]> {
    try {
      const whereCondition = { idUsine };

      if (!pagination) {
        return this.zoneControleRepository.find({
          where: whereCondition,
          order: { nom: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [zones, total] = await this.zoneControleRepository.findAndCount({
        where: whereCondition,
        order: { nom: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(zones, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des zones de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ZoneControleService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<ZoneControle> {
    try {
      const zone = await this.zoneControleRepository.findOne({
        where: { Id: id, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Zone de contrôle avec l'ID ${id} non trouvée`
        );
      }

      return zone;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de la zone de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ZoneControleService"
      );
      throw error;
    }
  }

  async create(createDto: CreateZoneControleDto): Promise<{ id: number }> {
    try {
      const zone = this.zoneControleRepository.create({
        nom: createDto.nom,
        commentaire: createDto.commentaire || null,
        four: createDto.four || 0,
        idUsine: createDto.idUsine,
      });

      const saved = await this.zoneControleRepository.save(zone);

      this.logger.log(
        `Zone de contrôle créée: ${saved.nom} (ID: ${saved.Id})`,
        "ZoneControleService"
      );

      return { id: saved.Id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la zone de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ZoneControleService"
      );
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateZoneControleDto): Promise<void> {
    try {
      const existing = await this.zoneControleRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Zone de contrôle avec l'ID ${id} non trouvée`
        );
      }

      const updateData: Partial<ZoneControle> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.commentaire !== undefined)
        updateData.commentaire = updateDto.commentaire;
      if (updateDto.four !== undefined) updateData.four = updateDto.four;

      if (Object.keys(updateData).length > 0) {
        await this.zoneControleRepository.update(id, updateData);
      }

      this.logger.log(
        `Zone de contrôle mise à jour: ID ${id}`,
        "ZoneControleService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de la zone de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ZoneControleService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.zoneControleRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Zone de contrôle avec l'ID ${id} non trouvée`
        );
      }

      await this.zoneControleRepository.delete(id);

      this.logger.log(
        `Zone de contrôle supprimée: ID ${id}`,
        "ZoneControleService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de la zone de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ZoneControleService"
      );
      throw error;
    }
  }
}
