import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../../common/dto/pagination.dto";
import { LoggerService } from "../../../common/services/logger.service";
import { ImportTonnageParametre } from "../../../entities";
import {
  CreateImportTonnageParametreDto,
  UpdateImportTonnageParametreDto,
} from "./dto";

@Injectable()
export class ImportTonnageParametreService {
  constructor(
    @InjectRepository(ImportTonnageParametre)
    private readonly importTonnageParametreRepository: Repository<ImportTonnageParametre>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<
    PaginatedResult<ImportTonnageParametre> | ImportTonnageParametre[]
  > {
    try {
      const whereCondition = idUsine ? { idUsine } : {};

      if (!pagination) {
        return this.importTonnageParametreRepository.find({
          where: whereCondition,
          order: { id: "ASC" },
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] =
        await this.importTonnageParametreRepository.findAndCount({
          where: whereCondition,
          order: { id: "ASC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(imports, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des paramètres d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateImportTonnageParametreDto,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const importTonnageParametre =
        this.importTonnageParametreRepository.create({
          delimiter: createDto.delimiter,
          header: createDto.header,
          client: createDto.client,
          typeDechet: createDto.typeDechet,
          dateEntree: createDto.dateEntree,
          tonnage: createDto.tonnage,
          entreeSortie: createDto.entreeSortie,
          dateFormat: createDto.dateFormat,
          skipEmptyRows: createDto.skipEmptyRows,
          deleteAll: createDto.deleteAll,
          poids: createDto.poids,
          idUsine,
        });

      const saved = await this.importTonnageParametreRepository.save(
        importTonnageParametre
      );

      this.logger.log(
        `Paramètre d'import tonnage créé (ID: ${saved.id})`,
        "ImportTonnageParametreService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du paramètre d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateImportTonnageParametreDto
  ): Promise<void> {
    try {
      const existing = await this.importTonnageParametreRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Paramètre d'import tonnage avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ImportTonnageParametre> = {};

      if (updateDto.delimiter !== undefined)
        updateData.delimiter = updateDto.delimiter;
      if (updateDto.header !== undefined) updateData.header = updateDto.header;
      if (updateDto.client !== undefined) updateData.client = updateDto.client;
      if (updateDto.typeDechet !== undefined)
        updateData.typeDechet = updateDto.typeDechet;
      if (updateDto.dateEntree !== undefined)
        updateData.dateEntree = updateDto.dateEntree;
      if (updateDto.tonnage !== undefined)
        updateData.tonnage = updateDto.tonnage;
      if (updateDto.entreeSortie !== undefined)
        updateData.entreeSortie = updateDto.entreeSortie;
      if (updateDto.dateFormat !== undefined)
        updateData.dateFormat = updateDto.dateFormat;
      if (updateDto.skipEmptyRows !== undefined)
        updateData.skipEmptyRows = updateDto.skipEmptyRows;
      if (updateDto.deleteAll !== undefined)
        updateData.deleteAll = updateDto.deleteAll;
      if (updateDto.poids !== undefined) updateData.poids = updateDto.poids;

      if (Object.keys(updateData).length > 0) {
        await this.importTonnageParametreRepository.update(id, updateData);
      }

      this.logger.log(
        `Paramètre d'import tonnage mis à jour: ID ${id}`,
        "ImportTonnageParametreService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du paramètre d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.importTonnageParametreRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(
          `Paramètre d'import tonnage avec l'ID ${id} non trouvé`
        );
      }

      await this.importTonnageParametreRepository.delete(id);

      this.logger.log(
        `Paramètre d'import tonnage supprimé: ID ${id}`,
        "ImportTonnageParametreService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du paramètre d'import tonnage",
        error instanceof Error ? error.stack : String(error),
        "ImportTonnageParametreService"
      );
      throw error;
    }
  }
}
