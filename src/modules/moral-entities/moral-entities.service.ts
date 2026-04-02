import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto/pagination.dto";
import { LoggerService } from "@/common/services/logger.service";
import { MoralEntityNew, ProductNew } from "@/entities";

import { CreateMoralEntityDto, UpdateMoralEntityDto } from "./dto";

export interface MoralEntityWithTypeDechet extends MoralEntityNew {
  typeDechet: ProductNew | null;
}

@Injectable()
export class MoralEntitiesService {
  constructor(
    @InjectRepository(MoralEntityNew)
    private readonly moralEntityRepository: Repository<MoralEntityNew>,
    @InjectRepository(ProductNew)
    private readonly productRepository: Repository<ProductNew>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<
    PaginatedResult<MoralEntityWithTypeDechet> | MoralEntityWithTypeDechet[]
  > {
    try {
      const queryBuilder = this.moralEntityRepository
        .createQueryBuilder("mr")
        .leftJoinAndMapOne(
          "mr.typeDechet",
          ProductNew,
          "p",
          "LEFT(p.Code, 5) = LEFT(mr.Code, 5) AND p.idUsine = :idUsine",
          { idUsine }
        )
        .where("mr.idUsine = :idUsine", { idUsine })
        .orderBy("mr.Name", "ASC");

      if (!pagination) {
        const entities = await queryBuilder.getMany();
        return entities as MoralEntityWithTypeDechet[];
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [entities, total] = await queryBuilder
        .skip(offset)
        .take(limit)
        .getManyAndCount();

      return createPaginatedResult(
        entities as MoralEntityWithTypeDechet[],
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des entités morales",
        error instanceof Error ? error.stack : String(error),
        "MoralEntitiesService"
      );
      throw error;
    }
  }

  async findOne(
    id: number,
    idUsine: number
  ): Promise<MoralEntityWithTypeDechet> {
    try {
      const entity = await this.moralEntityRepository
        .createQueryBuilder("mr")
        .leftJoinAndMapOne(
          "mr.typeDechet",
          ProductNew,
          "p",
          "LEFT(p.Code, 5) = LEFT(mr.Code, 5) AND p.idUsine = :idUsine",
          { idUsine }
        )
        .where("mr.id = :id", { id })
        .andWhere("mr.idUsine = :idUsine", { idUsine })
        .getOne();

      if (!entity) {
        throw new NotFoundException(
          `Entité morale avec l'ID ${id} non trouvée`
        );
      }

      return entity as MoralEntityWithTypeDechet;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'entité morale",
        error instanceof Error ? error.stack : String(error),
        "MoralEntitiesService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateMoralEntityDto,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const entity = this.moralEntityRepository.create({
        ...createDto,
        idUsine,
        CreateDate: new Date(),
        LastModifiedDate: new Date(),
      });

      const saved = await this.moralEntityRepository.save(entity);

      this.logger.log(
        `Entité morale créée (ID: ${saved.id})`,
        "MoralEntitiesService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'entité morale",
        error instanceof Error ? error.stack : String(error),
        "MoralEntitiesService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateMoralEntityDto
  ): Promise<void> {
    try {
      const existing = await this.moralEntityRepository.findOne({
        where: { id: id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Entité morale avec l'ID ${id} non trouvée`
        );
      }

      await this.moralEntityRepository.update(id, {
        ...updateDto,
        LastModifiedDate: new Date(),
      });

      this.logger.log(
        `Entité morale mise à jour: ID ${id}`,
        "MoralEntitiesService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'entité morale",
        error instanceof Error ? error.stack : String(error),
        "MoralEntitiesService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.moralEntityRepository.findOne({
        where: { id: id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Entité morale avec l'ID ${id} non trouvée`
        );
      }

      await this.moralEntityRepository.delete(id);

      this.logger.log(
        `Entité morale supprimée: ID ${id}`,
        "MoralEntitiesService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'entité morale",
        error instanceof Error ? error.stack : String(error),
        "MoralEntitiesService"
      );
      throw error;
    }
  }
}
