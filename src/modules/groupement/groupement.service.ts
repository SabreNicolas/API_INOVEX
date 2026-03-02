import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { ElementControle, Groupement, ZoneControle } from "../../entities";
import { CreateGroupementDto, UpdateGroupementDto } from "./dto";

@Injectable()
export class GroupementService {
  constructor(
    @InjectRepository(Groupement)
    private readonly groupementRepository: Repository<Groupement>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    @InjectRepository(ElementControle)
    private readonly elementControleRepository: Repository<ElementControle>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Groupement> | Groupement[]> {
    try {
      // Récupérer les zones de l'usine
      const zones = await this.zoneControleRepository.find({
        where: { idUsine },
        select: ["Id"],
      });
      const zoneIds = zones.map(z => z.Id);

      if (zoneIds.length === 0) {
        return pagination
          ? createPaginatedResult(
              [],
              0,
              pagination.page || 1,
              pagination.limit || 20
            )
          : [];
      }

      const queryBuilder = this.groupementRepository
        .createQueryBuilder("groupement")
        .where("groupement.zoneId IN (:...zoneIds)", { zoneIds })
        .orderBy("groupement.groupement", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [groupements, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(groupements, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des groupements",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }

  async findByZone(
    zoneId: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Groupement> | Groupement[]> {
    try {
      const whereCondition = { zoneId };

      if (!pagination) {
        return this.groupementRepository.find({
          where: whereCondition,
          order: { groupement: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [groupements, total] = await this.groupementRepository.findAndCount(
        {
          where: whereCondition,
          order: { groupement: "ASC" },
          skip: offset,
          take: limit,
        }
      );

      return createPaginatedResult(groupements, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des groupements par zone",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Groupement> {
    try {
      const groupement = await this.groupementRepository.findOne({
        where: { id },
      });

      if (!groupement) {
        throw new NotFoundException(`Groupement avec l'ID ${id} non trouvé`);
      }

      return groupement;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération du groupement",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }

  async create(createDto: CreateGroupementDto): Promise<{ id: number }> {
    try {
      const groupement = this.groupementRepository.create({
        groupement: createDto.groupement,
        zoneId: createDto.zoneId,
      });

      const saved = await this.groupementRepository.save(groupement);

      this.logger.log(
        `Groupement créé: ${saved.groupement} (ID: ${saved.id})`,
        "GroupementService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du groupement",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateGroupementDto): Promise<void> {
    try {
      const existing = await this.groupementRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Groupement avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<Groupement> = {};

      if (updateDto.groupement !== undefined)
        updateData.groupement = updateDto.groupement;
      if (updateDto.zoneId !== undefined) updateData.zoneId = updateDto.zoneId;

      if (Object.keys(updateData).length > 0) {
        await this.groupementRepository.update(id, updateData);
      }

      this.logger.log(`Groupement mis à jour: ID ${id}`, "GroupementService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du groupement",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.groupementRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Groupement avec l'ID ${id} non trouvé`);
      }

      // Supprimer les éléments de contrôle associés au groupement
      await this.elementControleRepository.delete({ idGroupement: id });

      await this.groupementRepository.delete(id);

      this.logger.log(`Groupement supprimé: ID ${id}`, "GroupementService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du groupement",
        error instanceof Error ? error.stack : String(error),
        "GroupementService"
      );
      throw error;
    }
  }
}
