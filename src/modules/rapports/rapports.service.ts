import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "../../common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import { Rapport } from "../../entities";

@Injectable()
export class RapportsService {
  constructor(
    @InjectRepository(Rapport)
    private readonly rapportRepository: Repository<Rapport>,
    private readonly logger: LoggerService
  ) {}

  async findByUsine(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Rapport> | Rapport[]> {
    try {
      if (!pagination) {
        return this.rapportRepository.find({
          where: { idUsine },
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] = await this.rapportRepository.findAndCount({
        where: { idUsine },
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des rapports",
        error instanceof Error ? error.stack : String(error),
        "RapportsService"
      );
      throw error;
    }
  }
}
