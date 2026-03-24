import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto/pagination.dto";
import { LoggerService } from "@/common/services/logger.service";
import { Arret } from "@/entities";

import { CreateArretDto, UpdateArretDto } from "./dto";

export interface ArretsGroupedByLigne {
  ligne: string;
  arrets: Arret[];
}

export interface ArretTotalByDescription {
  choixArrets: string;
  totalArrets: number;
  totalHeures: number;
}

export interface ArretTotalByLigne {
  ligne: string;
  totalArrets: number;
  totalHeures: number;
  arrets: ArretTotalByDescription[];
}

@Injectable()
export class ArretsService {
  constructor(
    @InjectRepository(Arret)
    private readonly arretRepository: Repository<Arret>,
    private readonly logger: LoggerService
  ) {}

  private static readonly LIGNES = [
    "ligne 1",
    "ligne 2",
    "ligne 3",
    "ligne 4",
    "gta 1",
    "gta 2",
    "gta 3",
    "gta 4",
    "rcu 1",
    "rcu 2",
    "rcu 3",
    "rcu 4",
    "dasri",
  ];

  private extractLigne(productName: string): string {
    const lower = productName.toLowerCase();
    for (const ligne of ArretsService.LIGNES) {
      if (lower.includes(ligne)) return ligne;
    }
    return "Autre";
  }

  private groupByLigne(arrets: Arret[]): ArretsGroupedByLigne[] {
    const map = new Map<string, Arret[]>();
    for (const a of arrets) {
      const name = a.product?.Name || "";
      const key = name ? this.extractLigne(name) : "Sans ligne";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries()).map(([ligne, arrets]) => ({
      ligne,
      arrets,
    }));
  }

  async findTotalsByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date
  ): Promise<ArretTotalByLigne[]> {
    try {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      const arrets = await this.arretRepository.find({
        relations: ["product"],
        where: {
          date_heure_debut: Between(startDate, adjustedEndDate),
          product: { idUsine },
        },
        order: { date_heure_debut: "ASC" },
      });

      const ligneMap = new Map<
        string,
        Map<string, { count: number; heures: number }>
      >();
      for (const a of arrets) {
        const name = a.product?.Name || "";
        const ligneKey = name ? this.extractLigne(name) : "Sans ligne";
        const descKey = a.product?.Name || "Sans description";
        if (!ligneMap.has(ligneKey)) ligneMap.set(ligneKey, new Map());
        const descMap = ligneMap.get(ligneKey)!;
        const existing = descMap.get(descKey) || { count: 0, heures: 0 };
        const heures =
          a.date_heure_debut && a.date_heure_fin
            ? (new Date(a.date_heure_fin).getTime() -
                new Date(a.date_heure_debut).getTime()) /
              3_600_000
            : 0;
        existing.count += 1;
        existing.heures += heures;
        descMap.set(descKey, existing);
      }

      return Array.from(ligneMap.entries()).map(([ligne, descMap]) => {
        const arrets = Array.from(descMap.entries()).map(
          ([choixArret, { count, heures }]) => ({
            choixArrets: choixArret,
            totalArrets: count,
            totalHeures: Math.round(heures * 100) / 100,
          })
        );
        return {
          ligne,
          totalArrets: arrets.reduce((sum, a) => sum + a.totalArrets, 0),
          totalHeures:
            Math.round(
              arrets.reduce((sum, a) => sum + a.totalHeures, 0) * 100
            ) / 100,
          arrets,
        };
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des totaux des arrêts",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ArretsGroupedByLigne> | ArretsGroupedByLigne[]> {
    try {
      if (!pagination) {
        const arrets = await this.arretRepository.find({
          relations: ["product"],
          where: { product: { idUsine } },
          order: { date_heure_debut: "DESC" },
        });
        return this.groupByLigne(arrets);
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [arrets, total] = await this.arretRepository.findAndCount({
        relations: ["product"],
        where: { product: { idUsine } },
        order: { date_heure_debut: "DESC" },
        skip: offset,
        take: limit,
      });
      return createPaginatedResult(
        this.groupByLigne(arrets),
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des arrêts",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ArretsGroupedByLigne> | ArretsGroupedByLigne[]> {
    try {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

      const whereCondition = {
        date_heure_debut: Between(startDate, adjustedEndDate),
        product: { idUsine },
      };

      if (!pagination) {
        const arrets = await this.arretRepository.find({
          relations: ["product"],
          where: whereCondition,
          order: { date_heure_debut: "DESC" },
        });
        return this.groupByLigne(arrets);
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [arrets, total] = await this.arretRepository.findAndCount({
        relations: ["product"],
        where: whereCondition,
        order: { date_heure_debut: "DESC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(
        this.groupByLigne(arrets),
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des arrêts par date",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async findByProduct(
    idUsine: number,
    productId: number,
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ArretsGroupedByLigne> | ArretsGroupedByLigne[]> {
    try {
      const whereCondition = { productId, product: { idUsine } };

      if (!pagination) {
        const arrets = await this.arretRepository.find({
          relations: ["product"],
          where: whereCondition,
          order: { date_heure_debut: "DESC" },
        });
        return this.groupByLigne(arrets);
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [arrets, total] = await this.arretRepository.findAndCount({
        relations: ["product"],
        where: whereCondition,
        order: { date_heure_debut: "DESC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(
        this.groupByLigne(arrets),
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des arrêts par produit",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<Arret> {
    try {
      const arret = await this.arretRepository.findOne({
        relations: ["product"],
        where: { id, product: { idUsine } },
      });

      if (!arret) {
        throw new NotFoundException(`Arrêt avec l'ID ${id} non trouvé`);
      }

      return arret;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'arrêt",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateArretDto,
    userId: number
  ): Promise<{ id: number }> {
    try {
      const arret = this.arretRepository.create({
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
        duree: createDto.duree,
        description: createDto.description || null,
        productId: createDto.productId,
        user: userId,
        date_saisie: new Date(),
      });

      const saved = await this.arretRepository.save(arret);

      this.logger.log(`Arrêt créé (ID: ${saved.id})`, "ArretsService");

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'arrêt",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateArretDto
  ): Promise<void> {
    try {
      const existing = await this.arretRepository.findOne({
        where: { id, product: { idUsine } },
        relations: ["product"],
      });

      if (!existing) {
        throw new NotFoundException(`Arrêt avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<Arret> = {};

      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.duree !== undefined) updateData.duree = updateDto.duree;
      if (updateDto.description !== undefined)
        updateData.description = updateDto.description;
      if (updateDto.productId !== undefined)
        updateData.productId = updateDto.productId;

      if (Object.keys(updateData).length > 0) {
        await this.arretRepository.update(id, updateData);
      }

      this.logger.log(`Arrêt mis à jour: ID ${id}`, "ArretsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'arrêt",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.arretRepository.findOne({
        where: { id, product: { idUsine } },
        relations: ["product"],
      });

      if (!existing) {
        throw new NotFoundException(`Arrêt avec l'ID ${id} non trouvé`);
      }

      await this.arretRepository.delete(id);

      this.logger.log(`Arrêt supprimé: ID ${id}`, "ArretsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'arrêt",
        error instanceof Error ? error.stack : String(error),
        "ArretsService"
      );
      throw error;
    }
  }
}
