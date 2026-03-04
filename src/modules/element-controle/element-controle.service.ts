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
import { CreateElementControleDto, UpdateElementControleDto } from "./dto";

@Injectable()
export class ElementControleService {
  constructor(
    @InjectRepository(ElementControle)
    private readonly elementControleRepository: Repository<ElementControle>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    @InjectRepository(Groupement)
    private readonly groupementRepository: Repository<Groupement>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ElementControle> | ElementControle[]> {
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

      const queryBuilder = this.elementControleRepository
        .createQueryBuilder("element")
        .where("element.zoneId IN (:...zoneIds)", { zoneIds })
        .orderBy("element.ordre", "ASC")
        .addOrderBy("element.nom", "ASC");

      if (!pagination) {
        return queryBuilder.getMany();
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [elements, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(elements, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des éléments de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async findByZone(
    zoneId: number,
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ElementControle> | ElementControle[]> {
    try {
      // Vérifier que la zone appartient à l'usine de l'utilisateur
      const zone = await this.zoneControleRepository.findOne({
        where: { Id: zoneId, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Zone avec l'ID ${zoneId} non trouvée pour cette usine`
        );
      }

      const whereCondition = { zoneId };

      if (!pagination) {
        return this.elementControleRepository.find({
          where: whereCondition,
          order: { ordre: "ASC", nom: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [elements, total] =
        await this.elementControleRepository.findAndCount({
          where: whereCondition,
          order: { ordre: "ASC", nom: "ASC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(elements, total, page, limit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération des éléments par zone",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async findByGroupement(
    idGroupement: number,
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ElementControle> | ElementControle[]> {
    try {
      // Vérifier que le groupement appartient à une zone de l'usine de l'utilisateur
      const groupement = await this.groupementRepository.findOne({
        where: { id: idGroupement },
      });

      if (!groupement) {
        throw new NotFoundException(
          `Groupement avec l'ID ${idGroupement} non trouvé`
        );
      }

      // Vérifier que la zone du groupement appartient à l'usine
      const zone = await this.zoneControleRepository.findOne({
        where: { Id: groupement.zoneId, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Groupement avec l'ID ${idGroupement} non accessible pour cette usine`
        );
      }

      const whereCondition = { idGroupement };

      if (!pagination) {
        return this.elementControleRepository.find({
          where: whereCondition,
          order: { ordre: "ASC", nom: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [elements, total] =
        await this.elementControleRepository.findAndCount({
          where: whereCondition,
          order: { ordre: "ASC", nom: "ASC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(elements, total, page, limit);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération des éléments par groupement",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<ElementControle> {
    try {
      const element = await this.elementControleRepository.findOne({
        where: { Id: id },
      });

      if (!element) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non trouvé`
        );
      }

      // Vérifier que l'élément appartient à une zone de l'usine de l'utilisateur
      if (element.zoneId === null) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} n'a pas de zone associée`
        );
      }

      const zone = await this.zoneControleRepository.findOne({
        where: { Id: element.zoneId, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non accessible pour cette usine`
        );
      }

      return element;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'élément de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async create(createDto: CreateElementControleDto): Promise<{ id: number }> {
    try {
      const element = this.elementControleRepository.create({
        nom: createDto.nom,
        zoneId: createDto.zoneId,
        valeurMin: createDto.valeurMin ?? null,
        valeurMax: createDto.valeurMax ?? null,
        typeChamp: createDto.typeChamp || null,
        unit: createDto.unit || null,
        defaultValue: createDto.defaultValue || null,
        isRegulateur: createDto.isRegulateur ?? null,
        listValues: createDto.listValues || null,
        isCompteur: createDto.isCompteur ?? null,
        ordre: createDto.ordre ?? null,
        idGroupement: createDto.idGroupement ?? null,
        CodeEquipement: createDto.CodeEquipement || null,
        infoSup: createDto.infoSup || "",
      });

      const saved = await this.elementControleRepository.save(element);

      this.logger.log(
        `Élément de contrôle créé: ${saved.nom} (ID: ${saved.Id})`,
        "ElementControleService"
      );

      return { id: saved.Id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'élément de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateElementControleDto,
    idUsine: number
  ): Promise<void> {
    try {
      const existing = await this.elementControleRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non trouvé`
        );
      }

      // Vérifier que l'élément appartient à une zone de l'usine de l'utilisateur
      if (existing.zoneId === null) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} n'a pas de zone associée`
        );
      }

      const zone = await this.zoneControleRepository.findOne({
        where: { Id: existing.zoneId, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non accessible pour cette usine`
        );
      }

      const updateData: Partial<ElementControle> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.zoneId !== undefined) updateData.zoneId = updateDto.zoneId;
      if (updateDto.valeurMin !== undefined)
        updateData.valeurMin = updateDto.valeurMin;
      if (updateDto.valeurMax !== undefined)
        updateData.valeurMax = updateDto.valeurMax;
      if (updateDto.typeChamp !== undefined)
        updateData.typeChamp = updateDto.typeChamp;
      if (updateDto.unit !== undefined) updateData.unit = updateDto.unit;
      if (updateDto.defaultValue !== undefined)
        updateData.defaultValue = updateDto.defaultValue;
      if (updateDto.isRegulateur !== undefined)
        updateData.isRegulateur = updateDto.isRegulateur;
      if (updateDto.listValues !== undefined)
        updateData.listValues = updateDto.listValues;
      if (updateDto.isCompteur !== undefined)
        updateData.isCompteur = updateDto.isCompteur;
      if (updateDto.ordre !== undefined) updateData.ordre = updateDto.ordre;
      if (updateDto.idGroupement !== undefined)
        updateData.idGroupement = updateDto.idGroupement;
      if (updateDto.CodeEquipement !== undefined)
        updateData.CodeEquipement = updateDto.CodeEquipement;
      if (updateDto.infoSup !== undefined)
        updateData.infoSup = updateDto.infoSup;

      if (Object.keys(updateData).length > 0) {
        await this.elementControleRepository.update(id, updateData);
      }

      this.logger.log(
        `Élément de contrôle mis à jour: ID ${id}`,
        "ElementControleService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'élément de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.elementControleRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non trouvé`
        );
      }

      // Vérifier que l'élément appartient à une zone de l'usine de l'utilisateur
      if (existing.zoneId === null) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} n'a pas de zone associée`
        );
      }

      const zone = await this.zoneControleRepository.findOne({
        where: { Id: existing.zoneId, idUsine },
      });

      if (!zone) {
        throw new NotFoundException(
          `Élément de contrôle avec l'ID ${id} non accessible pour cette usine`
        );
      }

      await this.elementControleRepository.delete(id);

      this.logger.log(
        `Élément de contrôle supprimé: ID ${id}`,
        "ElementControleService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'élément de contrôle",
        error instanceof Error ? error.stack : String(error),
        "ElementControleService"
      );
      throw error;
    }
  }
}
