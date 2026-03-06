import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "@/common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto";
import { LoggerService } from "@/common/services/logger.service";
import {
  Formulaire,
  FormulaireAffectation,
  MeasureNew,
  ProductNew,
} from "@/entities";

import { CreateFormulaireDto, UpdateFormulaireDto } from "./dto";

export interface FormulaireWithProducts extends Formulaire {
  produits: (FormulaireAffectation & { product?: ProductNew })[];
}

export interface FormulaireProductWithMeasures extends ProductNew {
  alias: string;
  measures: MeasureNew[];
}

@Injectable()
export class FormulaireService {
  constructor(
    @InjectRepository(Formulaire)
    private readonly formulaireRepository: Repository<Formulaire>,
    @InjectRepository(FormulaireAffectation)
    private readonly formulaireAffectationRepository: Repository<FormulaireAffectation>,
    @InjectRepository(ProductNew)
    private readonly productsRepository: Repository<ProductNew>,
    @InjectRepository(MeasureNew)
    private readonly measureNewRepository: Repository<MeasureNew>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Récupérer tous les formulaires par usine
   */
  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<Formulaire> | Formulaire[]> {
    try {
      const whereCondition = idUsine ? { idUsine } : {};

      if (!pagination) {
        return this.formulaireRepository.find({
          where: whereCondition,
          order: { nom: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [formulaires, total] = await this.formulaireRepository.findAndCount(
        {
          where: whereCondition,
          order: { nom: "ASC" },
          skip: offset,
          take: limit,
        }
      );

      return createPaginatedResult(formulaires, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des formulaires",
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Récupérer un formulaire par ID avec ses produits
   */
  async findOne(id: number): Promise<FormulaireWithProducts> {
    try {
      const formulaire = await this.formulaireRepository.findOne({
        where: { idFormulaire: id },
      });

      if (!formulaire) {
        throw new NotFoundException(`Formulaire avec l'ID ${id} non trouvé`);
      }

      const affectations = await this.formulaireAffectationRepository.find({
        where: { idFormulaire: id },
      });

      // Récupérer les produits associés
      const produitsAvecDetails = await Promise.all(
        affectations.map(async affectation => {
          const product = await this.productsRepository.findOne({
            where: { Id: affectation.idProduct },
            relations: ["elementRondier"],
          });
          return {
            ...affectation,
            product: product || undefined,
          };
        })
      );

      return {
        ...formulaire,
        produits: produitsAvecDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération du formulaire ${id}`,
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Récupérer tous les formulaires avec leurs produits
   */
  async findAllWithProducts(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<
    PaginatedResult<FormulaireWithProducts> | FormulaireWithProducts[]
  > {
    try {
      const whereCondition = idUsine ? { idUsine } : {};

      let formulaires: Formulaire[];
      let total: number;

      if (!pagination) {
        formulaires = await this.formulaireRepository.find({
          where: whereCondition,
          order: { nom: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        total = formulaires.length;
      } else {
        const { page = 1, limit = 20 } = pagination;
        const offset = (page - 1) * limit;

        [formulaires, total] = await this.formulaireRepository.findAndCount({
          where: whereCondition,
          order: { nom: "ASC" },
          skip: offset,
          take: limit,
        });
      }

      // Récupérer les produits pour chaque formulaire
      const formulairesWithProducts = await Promise.all(
        formulaires.map(async formulaire => {
          const affectations = await this.formulaireAffectationRepository.find({
            where: { idFormulaire: formulaire.idFormulaire },
          });

          const produitsAvecDetails = await Promise.all(
            affectations.map(async affectation => {
              const product = await this.productsRepository.findOne({
                where: { Id: affectation.idProduct },
                relations: ["elementRondier"],
              });
              return {
                ...affectation,
                product: product || undefined,
              };
            })
          );

          return {
            ...formulaire,
            produits: produitsAvecDetails,
          };
        })
      );

      if (!pagination) {
        return formulairesWithProducts;
      }

      const { page = 1, limit = 20 } = pagination;
      return createPaginatedResult(formulairesWithProducts, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des formulaires avec produits",
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les produits d'un formulaire avec leurs mesures (similaire à /products/sortants/measures)
   */
  async findFormulaireProductsWithMeasures(
    idFormulaire: number,
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<FormulaireProductWithMeasures[]> {
    try {
      // Vérifier que le formulaire existe
      const formulaire = await this.formulaireRepository.findOne({
        where: { idFormulaire },
      });

      if (!formulaire) {
        throw new NotFoundException(
          `Formulaire avec l'ID ${idFormulaire} non trouvé`
        );
      }

      // Vérifier que le formulaire appartient à l'usine si spécifié
      if (idUsine && formulaire.idUsine !== idUsine) {
        throw new NotFoundException(
          `Formulaire avec l'ID ${idFormulaire} non trouvé pour cette usine`
        );
      }

      // Récupérer les affectations du formulaire
      const affectations = await this.formulaireAffectationRepository.find({
        where: { idFormulaire },
      });

      if (affectations.length === 0) {
        return [];
      }

      // Récupérer les IDs uniques des produits
      const uniqueProductIds = [...new Set(affectations.map(a => a.idProduct))];

      // Récupérer les produits avec leurs mesures
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
        .andWhere("p.Id IN (:...uniqueProductIds)", { uniqueProductIds })
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      const products = await qb.getMany();

      // Créer une map des produits par ID pour lookup rapide
      const productMap = new Map<
        number,
        ProductNew & { measures?: MeasureNew[] }
      >();
      products.forEach(p => {
        productMap.set(p.Id, p as ProductNew & { measures?: MeasureNew[] });
      });

      // Itérer sur les affectations pour conserver les doublons avec alias différents
      return affectations
        .map(a => {
          const p = productMap.get(a.idProduct);
          if (!p) return null;
          return {
            ...p,
            Name: a.alias || p.Name,
            alias: a.alias || "",
            measures: p.measures || [],
          };
        })
        .filter((item): item is FormulaireProductWithMeasures => item !== null);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération des produits du formulaire ${idFormulaire} avec mesures`,
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Créer un nouveau formulaire avec ses produits
   */
  async create(
    createFormulaireDto: CreateFormulaireDto,
    idUsine: number
  ): Promise<FormulaireWithProducts> {
    try {
      // Créer le formulaire
      const formulaire = this.formulaireRepository.create({
        nom: createFormulaireDto.nom,
        idUsine,
      });

      const savedFormulaire = await this.formulaireRepository.save(formulaire);

      // Créer les affectations de produits
      const affectations: FormulaireAffectation[] = [];
      if (
        createFormulaireDto.produits &&
        createFormulaireDto.produits.length > 0
      ) {
        for (const produit of createFormulaireDto.produits) {
          const affectation = this.formulaireAffectationRepository.create({
            idFormulaire: savedFormulaire.idFormulaire,
            idProduct: produit.idProduct,
            alias: produit.alias,
          });
          const savedAffectation =
            await this.formulaireAffectationRepository.save(affectation);
          affectations.push(savedAffectation);
        }
      }

      // Récupérer les produits associés
      const produitsAvecDetails = await Promise.all(
        affectations.map(async affectation => {
          const product = await this.productsRepository.findOne({
            where: { Id: affectation.idProduct },
            relations: ["elementRondier"],
          });
          return {
            ...affectation,
            product: product || undefined,
          };
        })
      );

      return {
        ...savedFormulaire,
        produits: produitsAvecDetails,
      };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du formulaire",
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Mettre à jour un formulaire existant avec ses produits
   */
  async update(
    id: number,
    updateFormulaireDto: UpdateFormulaireDto,
    idUsine?: number
  ): Promise<FormulaireWithProducts> {
    try {
      // Vérifier que le formulaire existe
      const existingFormulaire = await this.formulaireRepository.findOne({
        where: { idFormulaire: id },
      });

      if (!existingFormulaire) {
        throw new NotFoundException(`Formulaire avec l'ID ${id} non trouvé`);
      }

      // Vérifier que le formulaire appartient à l'usine si spécifié
      if (idUsine && existingFormulaire.idUsine !== idUsine) {
        throw new NotFoundException(
          `Formulaire avec l'ID ${id} non trouvé pour cette usine`
        );
      }

      // Mettre à jour le nom si fourni
      if (updateFormulaireDto.nom) {
        existingFormulaire.nom = updateFormulaireDto.nom;
        await this.formulaireRepository.save(existingFormulaire);
      }

      // Mettre à jour les produits si fournis
      if (updateFormulaireDto.produits !== undefined) {
        // Supprimer les anciennes affectations
        await this.formulaireAffectationRepository.delete({ idFormulaire: id });

        // Créer les nouvelles affectations
        for (const produit of updateFormulaireDto.produits) {
          const affectation = this.formulaireAffectationRepository.create({
            idFormulaire: id,
            idProduct: produit.idProduct,
            alias: produit.alias,
          });
          await this.formulaireAffectationRepository.save(affectation);
        }
      }

      // Retourner le formulaire mis à jour avec les produits
      return this.findOne(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la mise à jour du formulaire ${id}`,
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }

  /**
   * Supprimer un formulaire et ses affectations
   */
  async delete(id: number, idUsine?: number): Promise<void> {
    try {
      const formulaire = await this.formulaireRepository.findOne({
        where: { idFormulaire: id },
      });

      if (!formulaire) {
        throw new NotFoundException(`Formulaire avec l'ID ${id} non trouvé`);
      }

      // Vérifier que le formulaire appartient à l'usine si spécifié
      if (idUsine && formulaire.idUsine !== idUsine) {
        throw new NotFoundException(
          `Formulaire avec l'ID ${id} non trouvé pour cette usine`
        );
      }

      // Supprimer les affectations
      await this.formulaireAffectationRepository.delete({ idFormulaire: id });

      // Supprimer le formulaire
      await this.formulaireRepository.delete(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la suppression du formulaire ${id}`,
        error instanceof Error ? error.stack : String(error),
        "FormulaireService"
      );
      throw error;
    }
  }
}
