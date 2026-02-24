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
import { ImportTonnageReactif } from "../../../entities";
import {
  CreateImportTonnageReactifDto,
  UpdateImportTonnageReactifDto,
} from "./dto";

@Injectable()
export class ImportTonnageReactifService {
  constructor(
    @InjectRepository(ImportTonnageReactif)
    private readonly importTonnageReactifRepository: Repository<ImportTonnageReactif>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ImportTonnageReactif> | ImportTonnageReactif[]> {
    try {
      if (!pagination) {
        //name like %livraison%
        const imports = await this.importTonnageReactifRepository.find({
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
        await this.importTonnageReactifRepository.findAndCount({
          where: idUsine ? { idUsine } : {},
          order: { id: "ASC" },
          skip: offset,
          take: limit,
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
        "Erreur lors de la récupération des imports tonnage réactifs",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageReactifService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateImportTonnageReactifDto
  ): Promise<{ id: number }> {
    try {
      const importTonnageReactif = this.importTonnageReactifRepository.create({
        ProductId: createDto.ProductId,
        idUsine: createDto.idUsine,
        productImport: createDto.productImport,
      });

      const saved =
        await this.importTonnageReactifRepository.save(importTonnageReactif);

      this.logger.log(
        `Import tonnage réactif créé: ${saved.productImport} (ID: ${saved.id})`,
        "ImportTonnageReactifService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'import tonnage réactif",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageReactifService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateImportTonnageReactifDto
  ): Promise<void> {
    try {
      const existing = await this.importTonnageReactifRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage réactif avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ImportTonnageReactif> = {};

      if (updateDto.ProductId !== undefined)
        updateData.ProductId = updateDto.ProductId;
      if (updateDto.idUsine !== undefined)
        updateData.idUsine = updateDto.idUsine;
      if (updateDto.productImport !== undefined)
        updateData.productImport = updateDto.productImport;

      if (Object.keys(updateData).length > 0) {
        await this.importTonnageReactifRepository.update(id, updateData);
      }

      this.logger.log(
        `Import tonnage réactif mis à jour: ID ${id}`,
        "ImportTonnageReactifService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'import tonnage réactif",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageReactifService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.importTonnageReactifRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Import tonnage réactif avec l'ID ${id} non trouvé`
        );
      }

      await this.importTonnageReactifRepository.delete(id);

      this.logger.log(
        `Import tonnage réactif supprimé: ID ${id}`,
        "ImportTonnageReactifService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'import tonnage réactif",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageReactifService"
      );
      throw error;
    }
  }
}
