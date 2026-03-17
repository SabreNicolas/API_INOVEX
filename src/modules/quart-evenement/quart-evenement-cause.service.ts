import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartEvenementCause } from "../../entities";
import {
  CreateQuartEvenementCauseDto,
  UpdateQuartEvenementCauseDto,
} from "./dto";

@Injectable()
export class QuartEvenementCauseService {
  constructor(
    @InjectRepository(QuartEvenementCause)
    private readonly causeRepository: Repository<QuartEvenementCause>,
    private readonly logger: LoggerService
  ) {}

  async findAll(): Promise<QuartEvenementCause[]> {
    try {
      return this.causeRepository.find({
        order: { id: "DESC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des causes d'événements",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementCauseService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<QuartEvenementCause> {
    try {
      const cause = await this.causeRepository.findOne({
        where: { id },
      });

      if (!cause) {
        throw new NotFoundException(
          `Cause d'événement avec l'ID ${id} non trouvée`
        );
      }

      return cause;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de la cause d'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementCauseService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateQuartEvenementCauseDto
  ): Promise<{ id: number }> {
    try {
      const cause = this.causeRepository.create({
        cause: createDto.cause,
        valueGmao: createDto.valueGmao,
      });

      const saved = await this.causeRepository.save(cause);

      this.logger.log(
        `Cause d'événement créée: ${saved.cause} (ID: ${saved.id})`,
        "QuartEvenementCauseService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la cause d'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementCauseService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateQuartEvenementCauseDto
  ): Promise<void> {
    try {
      const existing = await this.causeRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Cause d'événement avec l'ID ${id} non trouvée`
        );
      }

      const updateData: Partial<QuartEvenementCause> = {};

      if (updateDto.cause !== undefined) updateData.cause = updateDto.cause;
      if (updateDto.valueGmao !== undefined)
        updateData.valueGmao = updateDto.valueGmao;

      if (Object.keys(updateData).length > 0) {
        await this.causeRepository.update(id, updateData);
      }

      this.logger.log(
        `Cause d'événement mise à jour: ID ${id}`,
        "QuartEvenementCauseService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de la cause d'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementCauseService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.causeRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(
          `Cause d'événement avec l'ID ${id} non trouvée`
        );
      }

      await this.causeRepository.delete(id);

      this.logger.log(
        `Cause d'événement supprimée: ID ${id}`,
        "QuartEvenementCauseService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de la cause d'événement",
        error instanceof Error ? error.stack : String(error),
        "QuartEvenementCauseService"
      );
      throw error;
    }
  }
}
