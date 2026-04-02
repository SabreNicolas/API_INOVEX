import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../../common/dto/pagination.dto";
import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnage, MoralEntityNew, ProductNew } from "../../../entities";
import { CreateImportTonnageDto, UpdateImportTonnageDto } from "./dto";

@Injectable()
export class ImportTonnageService {
  constructor(
    @InjectRepository(ImportTonnage)
    private readonly importTonnageRepository: Repository<ImportTonnage>,
    @InjectRepository(MoralEntityNew)
    private readonly moralEntityRepository: Repository<MoralEntityNew>,
    @InjectRepository(ProductNew)
    private readonly productRepository: Repository<ProductNew>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<MoralEntityNew> | MoralEntityNew[]> {
    try {
      const queryBuilder = this.moralEntityRepository
        .createQueryBuilder("moralEntity")
        .innerJoinAndMapOne(
          "moralEntity.product",
          ProductNew,
          "product",
          "product.Code = moralEntity.Code AND product.idUsine = :idUsine AND moralEntity.Enabled = 1",
          { idUsine }
        )
        .leftJoinAndSelect(
          "moralEntity.importTonnages",
          "importTonnage",
          "importTonnage.ProducerId = moralEntity.id"
        )
        .where("moralEntity.idUsine = :idUsine", { idUsine })
        .orderBy("moralEntity.Name", "ASC");

      if (idUsine) {
        queryBuilder.where("moralEntity.idUsine = :idUsine", { idUsine });
      }

      if (!pagination) {
        const entities = await queryBuilder.getMany();
        return entities;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [entities, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(entities, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des imports tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageService"
      );
      throw error;
    }
  }

  async create(createDto: CreateImportTonnageDto): Promise<{ id: number }> {
    try {
      const importTonnage = this.importTonnageRepository.create({
        ProducerId: createDto.ProducerId,
        ProductId: createDto.ProductId,
        idUsine: createDto.idUsine,
        nomImport: createDto.nomImport,
        productImport: createDto.productImport,
      });

      const saved = await this.importTonnageRepository.save(importTonnage);

      this.logger.log(
        `Import tonnage créé: ${saved.nomImport} (ID: ${saved.id})`,
        "ImportTonnageService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageService"
      );
      throw error;
    }
  }

  async update(id: number, updateDto: UpdateImportTonnageDto): Promise<void> {
    try {
      const existing = await this.importTonnageRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ImportTonnage> = {};

      if (updateDto.ProducerId !== undefined)
        updateData.ProducerId = updateDto.ProducerId;
      if (updateDto.ProductId !== undefined)
        updateData.ProductId = updateDto.ProductId;
      if (updateDto.idUsine !== undefined)
        updateData.idUsine = updateDto.idUsine;
      if (updateDto.nomImport !== undefined)
        updateData.nomImport = updateDto.nomImport;
      if (updateDto.productImport !== undefined)
        updateData.productImport = updateDto.productImport;

      if (Object.keys(updateData).length > 0) {
        await this.importTonnageRepository.update(id, updateData);
      }

      this.logger.log(
        `Import tonnage mis à jour: ID ${id}`,
        "ImportTonnageService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.importTonnageRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage avec l'ID ${id} non trouvé`
        );
      }

      await this.importTonnageRepository.delete(id);

      this.logger.log(
        `Import tonnage supprimé: ID ${id}`,
        "ImportTonnageService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageService"
      );
      throw error;
    }
  }
}
