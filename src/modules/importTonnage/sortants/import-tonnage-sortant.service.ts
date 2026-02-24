import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "../../../common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../../common/dto/pagination.dto";
import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageSortant } from "../../../entities";
import {
  CreateImportTonnageSortantDto,
  UpdateImportTonnageSortantDto,
} from "./dto";

@Injectable()
export class ImportTonnageSortantService {
  constructor(
    @InjectRepository(ImportTonnageSortant)
    private readonly importTonnageSortantRepository: Repository<ImportTonnageSortant>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ImportTonnageSortant> | ImportTonnageSortant[]> {
    try {
      if (!pagination) {
        const imports = await this.importTonnageSortantRepository.find({
          where: idUsine ? { idUsine } : {},
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          join: {
            alias: "importTonnageSortant",
            leftJoinAndSelect: {
              product: "importTonnageSortant.product",
            },
          },
        });
        return imports;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] =
        await this.importTonnageSortantRepository.findAndCount({
          order: { id: "ASC" },
          skip: offset,
          take: limit,
          where: idUsine ? { idUsine } : {},
          join: {
            alias: "importTonnageSortant",
            leftJoinAndSelect: {
              product: "importTonnageSortant.product",
            },
          },
        });

      return createPaginatedResult(imports, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des imports tonnage sortants",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageSortantService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateImportTonnageSortantDto
  ): Promise<{ id: number }> {
    try {
      const importTonnageSortant = this.importTonnageSortantRepository.create({
        ProductId: createDto.ProductId,
        idUsine: createDto.idUsine,
        productImport: createDto.productImport,
      });

      const saved =
        await this.importTonnageSortantRepository.save(importTonnageSortant);

      this.logger.log(
        `Import tonnage sortant créé: ${saved.productImport} (ID: ${saved.id})`,
        "ImportTonnageSortantService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'import tonnage sortant",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageSortantService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateImportTonnageSortantDto
  ): Promise<void> {
    try {
      const existing = await this.importTonnageSortantRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage sortant avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ImportTonnageSortant> = {};

      if (updateDto.ProductId !== undefined)
        updateData.ProductId = updateDto.ProductId;
      if (updateDto.idUsine !== undefined)
        updateData.idUsine = updateDto.idUsine;
      if (updateDto.productImport !== undefined)
        updateData.productImport = updateDto.productImport;

      if (Object.keys(updateData).length > 0) {
        await this.importTonnageSortantRepository.update(id, updateData);
      }

      this.logger.log(
        `Import tonnage sortant mis à jour: ID ${id}`,
        "ImportTonnageSortantService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'import tonnage sortant",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageSortantService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.importTonnageSortantRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage sortant avec l'ID ${id} non trouvé`
        );
      }

      await this.importTonnageSortantRepository.delete(id);

      this.logger.log(
        `Import tonnage sortant supprimé: ID ${id}`,
        "ImportTonnageSortantService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'import tonnage sortant",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageSortantService"
      );
      throw error;
    }
  }
}
