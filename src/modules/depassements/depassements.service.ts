import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";

import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto/pagination.dto";
import { LoggerService } from "@/common/services/logger.service";
import {
  ChoixDepassement,
  ChoixDepassementProduit,
  DepassementNew,
  DepassementProduit,
} from "@/entities";

import { CreateDepassementNewDto, UpdateDepassementNewDto } from "./dto";

export interface DepassementsGroupedByLigne {
  ligne: string;
  depassements: DepassementNew[];
}

export interface DepassementTotalByChoix {
  choixDepassements: string;
  totalDepassements: number;
  totalHeures: number;
}

export interface DepassementTotalByLigne {
  ligne: string;
  totalDepassements: number;
  totalHeures: number;
  depassements: DepassementTotalByChoix[];
}

@Injectable()
export class DepassementsService {
  constructor(
    @InjectRepository(DepassementNew)
    private readonly depassementRepository: Repository<DepassementNew>,
    @InjectRepository(ChoixDepassement)
    private readonly choixDepassementRepository: Repository<ChoixDepassement>,
    @InjectRepository(ChoixDepassementProduit)
    private readonly choixDepassementProduitRepository: Repository<ChoixDepassementProduit>,
    @InjectRepository(DepassementProduit)
    private readonly depassementProduitRepository: Repository<DepassementProduit>,
    private readonly logger: LoggerService
  ) {}

  private groupByLigne(
    depassements: DepassementNew[]
  ): DepassementsGroupedByLigne[] {
    const map = new Map<string, DepassementNew[]>();
    for (const d of depassements) {
      const key = d.ligne || "Sans ligne";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries()).map(([ligne, depassements]) => ({
      ligne,
      depassements,
    }));
  }

  async findChoixWithProduits(): Promise<
    { id: number; nom: string; produits: ChoixDepassementProduit[] }[]
  > {
    try {
      const choix = await this.choixDepassementRepository.find({
        order: { nom: "ASC" },
      });

      const liaisons = await this.depassementProduitRepository.find();

      const produits = await this.choixDepassementProduitRepository.find({
        order: { nom: "ASC" },
      });
      const produitMap = new Map(produits.map(p => [p.id, p]));

      const liaisonsByChoix = new Map<number, number[]>();
      for (const l of liaisons) {
        if (!liaisonsByChoix.has(l.idChoixDepassements))
          liaisonsByChoix.set(l.idChoixDepassements, []);
        liaisonsByChoix
          .get(l.idChoixDepassements)!
          .push(l.idChoixDepassementsProduits);
      }

      return choix.map(c => ({
        id: c.id,
        nom: c.nom,
        produits: (liaisonsByChoix.get(c.id) || [])
          .map(id => produitMap.get(id))
          .filter((p): p is ChoixDepassementProduit => !!p),
      }));
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des choix de dépassements",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async findTotalsByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date
  ): Promise<DepassementTotalByLigne[]> {
    try {
      const depassements = await this.depassementRepository.find({
        where: {
          idUsine,
          date_heure_debut: Between(startDate, endDate),
        },
        order: { ligne: "ASC", choixDepassements: "ASC" },
      });

      const ligneMap = new Map<
        string,
        Map<string, { count: number; heures: number }>
      >();
      for (const d of depassements) {
        const ligneKey = d.ligne || "Sans ligne";
        const choixKey = d.choixDepassements || "Sans type";
        if (!ligneMap.has(ligneKey)) ligneMap.set(ligneKey, new Map());
        const choixMap = ligneMap.get(ligneKey)!;
        const existing = choixMap.get(choixKey) || { count: 0, heures: 0 };
        const heures =
          (new Date(d.date_heure_fin).getTime() -
            new Date(d.date_heure_debut).getTime()) /
          3_600_000;
        existing.count += 1;
        existing.heures += heures;
        choixMap.set(choixKey, existing);
      }

      return Array.from(ligneMap.entries()).map(([ligne, choixMap]) => {
        const depassements = Array.from(choixMap.entries()).map(
          ([choixDepassements, { count, heures }]) => ({
            choixDepassements,
            totalDepassements: count,
            totalHeures: Math.round(heures * 100) / 100,
          })
        );
        return {
          ligne,
          totalDepassements: depassements.reduce(
            (sum, d) => sum + d.totalDepassements,
            0
          ),
          totalHeures:
            Math.round(
              depassements.reduce((sum, d) => sum + d.totalHeures, 0) * 100
            ) / 100,
          depassements,
        };
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des totaux des dépassements",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async findAll(
    idUsine: number,
    pagination?: PaginationDto
  ): Promise<
    PaginatedResult<DepassementsGroupedByLigne> | DepassementsGroupedByLigne[]
  > {
    try {
      const whereCondition = { idUsine };

      if (!pagination) {
        const depassements = await this.depassementRepository.find({
          where: whereCondition,
          order: { ligne: "ASC", date_heure_debut: "DESC" },
        });
        return this.groupByLigne(depassements);
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [depassements, total] =
        await this.depassementRepository.findAndCount({
          where: whereCondition,
          order: { ligne: "ASC", date_heure_debut: "DESC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(
        this.groupByLigne(depassements),
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des dépassements",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date,
    pagination?: PaginationDto
  ): Promise<
    PaginatedResult<DepassementsGroupedByLigne> | DepassementsGroupedByLigne[]
  > {
    try {
      const whereCondition = {
        idUsine,
        date_heure_debut: Between(startDate, endDate),
      };

      if (!pagination) {
        const depassements = await this.depassementRepository.find({
          where: whereCondition,
          order: { ligne: "ASC", date_heure_debut: "DESC" },
        });
        return this.groupByLigne(depassements);
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [depassements, total] =
        await this.depassementRepository.findAndCount({
          where: whereCondition,
          order: { ligne: "ASC", date_heure_debut: "DESC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(
        this.groupByLigne(depassements),
        total,
        page,
        limit
      );
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des dépassements par date",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<DepassementNew> {
    try {
      const depassement = await this.depassementRepository.findOne({
        where: { id, idUsine },
      });

      if (!depassement) {
        throw new NotFoundException(`Dépassement avec l'ID ${id} non trouvé`);
      }

      return depassement;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération du dépassement",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateDepassementNewDto,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const depassement = this.depassementRepository.create({
        choixDepassements: createDto.choixDepassements || null,
        choixDepassementsProduits: createDto.choixDepassementsProduits || null,
        ligne: createDto.ligne || null,
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
        causes: createDto.causes || null,
        concentration: createDto.concentration || null,
        idUsine,
      });

      const saved = await this.depassementRepository.save(depassement);

      this.logger.log(
        `Dépassement créé (ID: ${saved.id})`,
        "DepassementsService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du dépassement",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateDepassementNewDto
  ): Promise<void> {
    try {
      const existing = await this.depassementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Dépassement avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<DepassementNew> = {};

      if (updateDto.choixDepassements !== undefined)
        updateData.choixDepassements = updateDto.choixDepassements;
      if (updateDto.choixDepassementsProduits !== undefined)
        updateData.choixDepassementsProduits =
          updateDto.choixDepassementsProduits;
      if (updateDto.ligne !== undefined) updateData.ligne = updateDto.ligne;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.causes !== undefined) updateData.causes = updateDto.causes;
      if (updateDto.concentration !== undefined)
        updateData.concentration = updateDto.concentration;

      if (Object.keys(updateData).length > 0) {
        await this.depassementRepository.update(id, updateData);
      }

      this.logger.log(
        `Dépassement mis à jour: ID ${id}`,
        "DepassementsService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du dépassement",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.depassementRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Dépassement avec l'ID ${id} non trouvé`);
      }

      await this.depassementRepository.delete(id);

      this.logger.log(`Dépassement supprimé: ID ${id}`, "DepassementsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du dépassement",
        error instanceof Error ? error.stack : String(error),
        "DepassementsService"
      );
      throw error;
    }
  }
}
