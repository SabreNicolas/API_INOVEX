import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "@/common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto";

import { LoggerService } from "../../common/services/logger.service";
import { ProductNew } from "../../entities";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductNew)
    private readonly productsRepository: Repository<ProductNew>,
    private readonly logger: LoggerService
  ) {}

  async findAllSortants(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ProductNew> | ProductNew[]> {
    try {
      if (!pagination) {
        const imports = await this.productsRepository.find({
          where: idUsine
            ? { idUsine, Enabled: 1, typeId: 5 }
            : { Enabled: 1, typeId: 5 },
          order: { Id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        return imports;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] = await this.productsRepository.findAndCount({
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
        where: idUsine
          ? { idUsine, Enabled: 1, typeId: 5 }
          : { Enabled: 1, typeId: 5 },
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

  async findAllReactifs(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ProductNew> | ProductNew[]> {
    try {
      if (!pagination) {
        const imports = await this.productsRepository.find({
          where: idUsine
            ? { idUsine, Enabled: 1, Name: Like(`%livraison%`) }
            : { Enabled: 1, Name: Like(`%livraison%`) },
          order: { Id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        return imports;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] = await this.productsRepository.findAndCount({
        order: { Id: "ASC" },
        skip: offset,
        take: limit,
        where: idUsine
          ? { idUsine, Enabled: 1, Name: Like(`%livraison%`) }
          : { Enabled: 1, Name: Like(`%livraison%`) },
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
}
