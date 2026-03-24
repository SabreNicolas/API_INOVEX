import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { FileUploadService } from "../../common/services/file-upload.service";
import { LoggerService } from "../../common/services/logger.service";
import { ModeOperatoire, ZoneControle } from "../../entities";
import { CreateModeOperatoireDto, UpdateModeOperatoireDto } from "./dto";

@Injectable()
export class ModeOperatoireService {
  constructor(
    @InjectRepository(ModeOperatoire)
    private readonly modeOperatoireRepository: Repository<ModeOperatoire>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    private readonly fileUploadService: FileUploadService,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<
    | PaginatedResult<ModeOperatoire & { zone: ZoneControle | null }>
    | (ModeOperatoire & { zone: ZoneControle | null })[]
  > {
    try {
      // Récupérer les zones de l'usine
      const zones = await this.zoneControleRepository.find({
        where: { idUsine },
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

      const queryBuilder = this.modeOperatoireRepository
        .createQueryBuilder("modeOperatoire")
        .where("modeOperatoire.zoneId IN (:...zoneIds)", { zoneIds })
        .orderBy("modeOperatoire.nom", "ASC");

      if (!pagination) {
        const modesOperatoires = await queryBuilder.getMany();
        return modesOperatoires.map(mo => ({
          ...mo,
          zone: zones.find(z => z.Id === mo.zoneId) || null,
        }));
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [modesOperatoires, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      const modesWithZone = modesOperatoires.map(mo => ({
        ...mo,
        zone: zones.find(z => z.Id === mo.zoneId) || null,
      }));

      return createPaginatedResult(modesWithZone, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des modes opératoires",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }

  async findByZone(
    zoneId: number,
    pagination?: PaginationDto
  ): Promise<
    | PaginatedResult<ModeOperatoire & { zone: ZoneControle | null }>
    | (ModeOperatoire & { zone: ZoneControle | null })[]
  > {
    try {
      const zone = await this.zoneControleRepository.findOne({
        where: { Id: zoneId },
      });

      const whereCondition = { zoneId };

      if (!pagination) {
        const modesOperatoires = await this.modeOperatoireRepository.find({
          where: whereCondition,
          order: { nom: "ASC" },
        });
        return modesOperatoires.map(mo => ({ ...mo, zone: zone || null }));
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [modesOperatoires, total] =
        await this.modeOperatoireRepository.findAndCount({
          where: whereCondition,
          order: { nom: "ASC" },
          skip: offset,
          take: limit,
        });

      const modesWithZone = modesOperatoires.map(mo => ({
        ...mo,
        zone: zone || null,
      }));

      return createPaginatedResult(modesWithZone, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des modes opératoires par zone",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }

  async findOne(
    id: number
  ): Promise<ModeOperatoire & { zone: ZoneControle | null }> {
    try {
      const modeOperatoire = await this.modeOperatoireRepository.findOne({
        where: { Id: id },
      });

      if (!modeOperatoire) {
        throw new NotFoundException(
          `Mode opératoire avec l'ID ${id} non trouvé`
        );
      }

      const zone = modeOperatoire.zoneId
        ? await this.zoneControleRepository.findOne({
            where: { Id: modeOperatoire.zoneId },
          })
        : null;

      return { ...modeOperatoire, zone: zone || null };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération du mode opératoire",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateModeOperatoireDto,
    file: Express.Multer.File,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const uploadedFile = await this.fileUploadService.saveModeOperatoireFile(
        file,
        idUsine
      );

      const modeOperatoire = this.modeOperatoireRepository.create({
        nom: createDto.nom,
        zoneId: createDto.zoneId || null,
        fichier: uploadedFile.url,
      });

      const saved = await this.modeOperatoireRepository.save(modeOperatoire);

      this.logger.log(
        `Mode opératoire créé: ${saved.nom} (ID: ${saved.Id})`,
        "ModeOperatoireService"
      );

      return { id: saved.Id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du mode opératoire",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateModeOperatoireDto,
    file?: Express.Multer.File,
    idUsine?: number
  ): Promise<void> {
    try {
      const existing = await this.modeOperatoireRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Mode opératoire avec l'ID ${id} non trouvé`
        );
      }

      const updateData: Partial<ModeOperatoire> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.zoneId !== undefined) updateData.zoneId = updateDto.zoneId;

      if (file) {
        // Supprimer l'ancien fichier
        if (existing.fichier) {
          this.fileUploadService.deleteModeOperatoireFile(existing.fichier);
        }

        // Uploader le nouveau fichier
        const uploadedFile =
          await this.fileUploadService.saveModeOperatoireFile(file, idUsine!);
        updateData.fichier = uploadedFile.url;
      }

      if (Object.keys(updateData).length > 0) {
        await this.modeOperatoireRepository.update(id, updateData);
      }

      this.logger.log(
        `Mode opératoire mis à jour: ID ${id}`,
        "ModeOperatoireService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du mode opératoire",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.modeOperatoireRepository.findOne({
        where: { Id: id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Mode opératoire avec l'ID ${id} non trouvé`
        );
      }

      // Supprimer le fichier associé
      if (existing.fichier) {
        this.fileUploadService.deleteModeOperatoireFile(existing.fichier);
      }

      await this.modeOperatoireRepository.delete(id);

      this.logger.log(
        `Mode opératoire supprimé: ID ${id}`,
        "ModeOperatoireService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du mode opératoire",
        error instanceof Error ? error.stack : String(error),
        "ModeOperatoireService"
      );
      throw error;
    }
  }
}
