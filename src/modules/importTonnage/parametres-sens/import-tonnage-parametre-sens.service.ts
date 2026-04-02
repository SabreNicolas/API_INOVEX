import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../../common/dto/pagination.dto";
import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageParametreSens } from "../../../entities";
import {
  CreateImportTonnageParametreSensDto,
  UpdateImportTonnageParametreSensDto,
} from "./dto";

@Injectable()
export class ImportTonnageParametreSensService {
  constructor(
    @InjectRepository(ImportTonnageParametreSens)
    private readonly importTonnageParametreSensRepository: Repository<ImportTonnageParametreSens>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto
  ): Promise<
    PaginatedResult<ImportTonnageParametreSens> | ImportTonnageParametreSens[]
  > {
    try {
      if (!pagination) {
        return this.importTonnageParametreSensRepository.find({
          order: { id: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] =
        await this.importTonnageParametreSensRepository.findAndCount({
          order: { id: "ASC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(imports, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des paramètres sens d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreSensService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateImportTonnageParametreSensDto
  ): Promise<{ id: number }> {
    try {
      const importTonnageParametreSens =
        this.importTonnageParametreSensRepository.create({
          sens: createDto.sens,
          correspondanceFichier: createDto.correspondanceFichier,
        });

      const saved = await this.importTonnageParametreSensRepository.save(
        importTonnageParametreSens
      );

      this.logger.log(
        `Paramètre sens d'import tonnage créé: ${saved.sens} (ID: ${saved.id})`,
        "ImportTonnageParametreSensService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du paramètre sens d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreSensService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateImportTonnageParametreSensDto
  ): Promise<void> {
    try {
      const existing = await this.importTonnageParametreSensRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Paramètre sens d'import tonnage avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ImportTonnageParametreSens> = {};

      if (updateDto.sens !== undefined) updateData.sens = updateDto.sens;
      if (updateDto.correspondanceFichier !== undefined)
        updateData.correspondanceFichier = updateDto.correspondanceFichier;

      if (Object.keys(updateData).length > 0) {
        await this.importTonnageParametreSensRepository.update(id, updateData);
      }

      this.logger.log(
        `Paramètre sens d'import tonnage mis à jour: ID ${id}`,
        "ImportTonnageParametreSensService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du paramètre sens d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreSensService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.importTonnageParametreSensRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Paramètre sens d'import tonnage avec l'ID ${id} non trouvé`
        );
      }

      await this.importTonnageParametreSensRepository.delete(id);

      this.logger.log(
        `Paramètre sens d'import tonnage supprimé: ID ${id}`,
        "ImportTonnageParametreSensService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du paramètre sens d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreSensService"
      );
      throw error;
    }
  }
}
