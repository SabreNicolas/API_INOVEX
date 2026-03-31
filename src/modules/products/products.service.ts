import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "@/common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "@/common/dto";

import { LoggerService } from "../../common/services/logger.service";
import {
  CategorieNew,
  ImportTonnage,
  ImportTonnageReactif,
  ImportTonnageSortant,
  MeasureNew,
  MoralEntityNew,
  ProductCategorieNew,
  ProductNew,
  Site,
  TypeNew,
} from "../../entities";
import {
  CreateMeasureDto,
  CreateMeasuresBatchDto,
  CreateProductDto,
  UpdateMeasureDto,
  UpdateProductDto,
} from "./dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductNew)
    private readonly productsRepository: Repository<ProductNew>,
    @InjectRepository(TypeNew)
    private readonly typeNewRepository: Repository<TypeNew>,
    @InjectRepository(MeasureNew)
    private readonly measureNewRepository: Repository<MeasureNew>,
    @InjectRepository(MoralEntityNew)
    private readonly moralEntityNewRepository: Repository<MoralEntityNew>,
    @InjectRepository(ImportTonnage)
    private readonly importTonnageRepository: Repository<ImportTonnage>,
    @InjectRepository(ImportTonnageSortant)
    private readonly importTonnageSortantRepository: Repository<ImportTonnageSortant>,
    @InjectRepository(ImportTonnageReactif)
    private readonly importTonnageReactifRepository: Repository<ImportTonnageReactif>,
    @InjectRepository(CategorieNew)
    private readonly categorieNewRepository: Repository<CategorieNew>,
    @InjectRepository(ProductCategorieNew)
    private readonly productCategorieNewRepository: Repository<ProductCategorieNew>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Récupérer tous les produits par usine
   */
  async findArrets(idUsine: number): Promise<ProductNew[]> {
    try {
      return this.productsRepository
        .createQueryBuilder("product")
        .where("product.idUsine = :idUsine", { idUsine })
        .andWhere("product.typeId = :typeId", { typeId: 4 })
        .andWhere("product.enabled = :enabled", { enabled: 1 })
        .andWhere("product.Name NOT LIKE :pattern", { pattern: "Temps%" })
        .andWhere("product.Code Like :codePattern", { codePattern: "30302%" })
        .orderBy("product.Name", "ASC")
        .getMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des produits arrêts",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer tous les produits par usine
   */
  async findAll(
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ProductNew> | ProductNew[]> {
    try {
      const whereCondition = idUsine ? { idUsine } : {};

      if (!pagination) {
        return this.productsRepository.find({
          where: whereCondition,
          order: { Name: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [products, total] = await this.productsRepository.findAndCount({
        where: whereCondition,
        order: { Name: "ASC" },
        skip: offset,
        take: limit,
        relations: ["elementRondier"],
      });

      return createPaginatedResult(products, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des produits",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer tous les types de produits
   */
  async findAllTypes(): Promise<TypeNew[]> {
    try {
      return this.typeNewRepository.find({
        order: { type: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des types de produits",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer un produit par ID
   */
  async findOne(id: number, idUsine?: number): Promise<ProductNew> {
    try {
      const whereCondition = idUsine ? { id: id, idUsine } : { id: id };

      const product = await this.productsRepository.findOne({
        where: whereCondition,
        relations: ["elementRondier"],
      });

      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la récupération du produit ${id}`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Créer un nouveau produit
   */
  async create(createDto: CreateProductDto): Promise<ProductNew> {
    try {
      const now = new Date();
      const product = this.productsRepository.create({
        ...createDto,
        CreateDate: now,
        LastModifiedDate: now,
        Enabled: 1,
      });

      const savedProduct = await this.productsRepository.save(product);

      this.logger.log(
        `Produit créé avec succès: ${savedProduct.id}`,
        "ProductsService"
      );

      return savedProduct;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du produit",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Mettre à jour un produit
   */
  async update(
    id: number,
    updateDto: UpdateProductDto,
    idUsine?: number
  ): Promise<ProductNew> {
    try {
      const product = await this.findOne(id, idUsine);

      // Gérer explicitement le cas où idElementRondier est null
      const shouldSetElementRondierToNull = updateDto.idElementRondier === null;

      const updatedProduct = this.productsRepository.merge(product, {
        ...updateDto,
        LastModifiedDate: new Date(),
      });

      // Si idElementRondier doit être mis à null, on l'assigne explicitement
      if (shouldSetElementRondierToNull) {
        updatedProduct.idElementRondier = null;
        updatedProduct.elementRondier = null;
      }

      const savedProduct = await this.productsRepository.save(updatedProduct);

      this.logger.log(
        `Produit mis à jour avec succès: ${savedProduct.id}`,
        "ProductsService"
      );

      return savedProduct;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la mise à jour du produit ${id}`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Activer/désactiver un produit (toggle visibility)
   */
  async toggleVisibility(id: number, idUsine?: number): Promise<ProductNew> {
    try {
      const whereCondition = idUsine ? { id: id, idUsine } : { id: id };

      const product = await this.productsRepository.findOne({
        where: whereCondition,
      });

      if (!product) {
        throw new NotFoundException(`Produit avec l'ID ${id} non trouvé`);
      }

      product.Enabled = product.Enabled === 1 ? 0 : 1;
      product.LastModifiedDate = new Date();

      const savedProduct = await this.productsRepository.save(product);

      this.logger.log(
        `Visibilité du produit ${id} modifiée: Enabled=${savedProduct.Enabled}`,
        "ProductsService"
      );

      return savedProduct;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors du toggle de visibilité du produit ${id}`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les produits par type
   */
  async findByType(
    typeId: number,
    pagination?: PaginationDto,
    idUsine?: number
  ): Promise<PaginatedResult<ProductNew> | ProductNew[]> {
    try {
      const whereCondition = idUsine ? { idUsine, typeId } : { typeId };

      if (!pagination) {
        return this.productsRepository.find({
          where: whereCondition,
          order: { Name: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [products, total] = await this.productsRepository.findAndCount({
        where: whereCondition,
        order: { Name: "ASC" },
        skip: offset,
        take: limit,
        relations: ["elementRondier"],
      });

      return createPaginatedResult(products, total, page, limit);
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits par type ${typeId}`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

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
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
        });
        return imports;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] = await this.productsRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
        where: idUsine
          ? { idUsine, Enabled: 1, typeId: 5 }
          : { Enabled: 1, typeId: 5 },
        relations: ["elementRondier"],
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
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
        });
        return imports;
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [imports, total] = await this.productsRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
        where: idUsine
          ? { idUsine, Enabled: 1, Name: Like(`%livraison%`) }
          : { Enabled: 1, Name: Like(`%livraison%`) },
        relations: ["elementRondier"],
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

  /**
   * Créer une nouvelle mesure
   */
  async createMeasure(createDto: CreateMeasureDto): Promise<MeasureNew> {
    try {
      const now = new Date();
      const measure = this.measureNewRepository.create({
        ...createDto,
        CreateDate: now,
        LastModifiedDate: now,
      });

      const savedMeasure = await this.measureNewRepository.save(measure);

      this.logger.log(
        `Mesure créée avec succès: ${savedMeasure.id}`,
        "ProductsService"
      );

      return savedMeasure;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la mesure",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Créer plusieurs mesures en batch
   * SQL Server limite à 2100 paramètres par requête, donc on découpe en chunks
   */
  async createMeasuresBatch(
    batchDto: CreateMeasuresBatchDto
  ): Promise<{ inserted: number; measures: MeasureNew[] }> {
    try {
      const now = new Date();
      const CHUNK_SIZE = 300; // 6 colonnes × 300 = 1800 paramètres (< 2100)

      const measuresToCreate = batchDto.measures.map(item =>
        this.measureNewRepository.create({
          EntryDate: item.EntryDate,
          Value: item.Value,
          ProductId: item.ProductId,
          ProducerId: item.ProducerId ?? null,
          CreateDate: now,
          LastModifiedDate: now,
        })
      );

      const allSavedMeasures: MeasureNew[] = [];

      // Découper en chunks pour éviter la limite SQL Server
      for (let i = 0; i < measuresToCreate.length; i += CHUNK_SIZE) {
        const chunk = measuresToCreate.slice(i, i + CHUNK_SIZE);
        const savedChunk = await this.measureNewRepository.save(chunk);
        allSavedMeasures.push(...savedChunk);
      }

      this.logger.log(
        `${allSavedMeasures.length} mesures créées en batch`,
        "ProductsService"
      );

      return {
        inserted: allSavedMeasures.length,
        measures: allSavedMeasures,
      };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création des mesures en batch",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Mettre à jour une mesure
   */
  async updateMeasure(
    id: number,
    updateDto: UpdateMeasureDto
  ): Promise<MeasureNew> {
    try {
      const measure = await this.measureNewRepository.findOne({
        where: { id: id },
      });

      if (!measure) {
        throw new NotFoundException(`Mesure avec l'ID ${id} non trouvée`);
      }

      const updatedMeasure = this.measureNewRepository.merge(measure, {
        ...updateDto,
        LastModifiedDate: new Date(),
      });

      const savedMeasure = await this.measureNewRepository.save(updatedMeasure);

      this.logger.log(
        `Mesure mise à jour avec succès: ${savedMeasure.id}`,
        "ProductsService"
      );

      return savedMeasure;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Erreur lors de la mise à jour de la mesure ${id}`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer toutes les moral entities avec leurs mesures et produits associés entre deux dates
   */
  async findMoralEntitiesWithMeasures(
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<
    (MoralEntityNew & { measures: MeasureNew[]; produits: ProductNew[] })[]
  > {
    try {
      // 1. Fetch moral entities with measures in date range
      const qb = this.moralEntityNewRepository
        .createQueryBuilder("me")
        .leftJoinAndMapMany(
          "me.measures",
          MeasureNew,
          "m",
          "m.ProducerId = me.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .orderBy("me.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.where("me.idUsine = :idUsine and me.enabled = 1", { idUsine });
      }

      const moralEntities = await qb.getMany();

      // 2. Batch fetch all products (with idUsine filter if applicable)
      const productsWhere = idUsine ? { idUsine } : {};
      const allProducts = await this.productsRepository.find({
        where: productsWhere,
        relations: ["elementRondier"],
      });

      // 3. Map products to each moral entity by code prefix match
      //    (moral entity code starts with product code)
      return moralEntities.map(me => {
        const measures =
          (me as MoralEntityNew & { measures?: MeasureNew[] }).measures || [];
        const produits = me.Code
          ? allProducts.filter(p => p.Code && me.Code!.startsWith(p.Code))
          : [];
        return {
          ...me,
          measures,
          produits,
        };
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des moral entities avec mesures",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les produits d'un type donné avec leurs mesures entre deux dates
   */
  async findByTypeWithMeasures(
    typeId: number,
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<(ProductNew & { measures: MeasureNew[] })[]> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.enabled = 1")
        .andWhere("p.typeId = :typeId", { typeId })
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const products = await qb.getMany();

      return products.map(p => ({
        ...p,
        measures:
          (p as ProductNew & { measures?: MeasureNew[] }).measures || [],
      }));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits type ${typeId} avec mesures`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les produits avec un nom donné avec leurs mesures entre deux dates
   */
  async findByNameWithMeasures(
    name: string,
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<(ProductNew & { measures: MeasureNew[] })[]> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.enabled = 1")
        .andWhere("p.Name LIKE :name", { name: `%${name}%` })
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const products = await qb.getMany();

      return products.map(p => ({
        ...p,
        measures:
          (p as ProductNew & { measures?: MeasureNew[] }).measures || [],
      }));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits avec le nom ${name} et leurs mesures`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  async findCompteursWithMeasures(
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<(ProductNew & { measures: MeasureNew[] })[]> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.enabled = 1")
        .andWhere("p.typeId = :typeId", { typeId: 4 }) // Supposons que le typeId 4 correspond aux compteurs
        .andWhere("p.Name NOT LIKE :name", { name: `%Arret%` }) // Exclure les produits contenant "Arret"
        .andWhere("p.Name NOT LIKE :name2", { name2: `%HEURES D'ARRET%` }) // Exclure les produits contenant "HEURES D'ARRET"
        .andWhere("p.Name NOT LIKE :name3", { name3: `%BAISSE DE CHARGE%` }) // Exclure les produits contenant "BAISSE DE CHARGE"
        .andWhere("p.Code NOT LIKE :code", { code: `701%` }) // Exclure les produits contenant "LIvRAISON" (avec I majuscule pour éviter de confondre avec les produits contenant "livraison" qui sont des réactifs)
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const products = await qb.getMany();

      return products.map(p => ({
        ...p,
        measures:
          (p as ProductNew & { measures?: MeasureNew[] }).measures || [],
      }));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits compteurs avec mesures`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  async findConsommablesWithMeasures(
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<(ProductNew & { measures: MeasureNew[] })[]> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.enabled = 1")
        .andWhere("p.typeId = :typeId", { typeId: 2 })
        .andWhere("p.Code NOT LIKE :code", { code: `801%` }) // Exclure les produits contenant "LIvRAISON" (avec I majuscule pour éviter de confondre avec les produits contenant "livraison" qui sont des réactifs)
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const products = await qb.getMany();

      return products.map(p => ({
        ...p,
        measures:
          (p as ProductNew & { measures?: MeasureNew[] }).measures || [],
      }));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits compteurs avec mesures`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  async findAnalysesWithMeasures(
    startDate: Date,
    endDate: Date,
    idUsine?: number
  ): Promise<(ProductNew & { measures: MeasureNew[] })[]> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .leftJoinAndSelect("p.elementRondier", "er")
        .leftJoinAndMapMany(
          "p.measures",
          MeasureNew,
          "m",
          "m.ProductId = p.id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.enabled = 1")
        .andWhere("p.typeId = :typeId", { typeId: 6 })
        .andWhere("p.Name NOT LIKE :name", { name: `%1/2%` }) // Exclure les produits contenant "LIvRAISON" (avec I majuscule pour éviter de confondre avec les produits contenant "livraison" qui sont des réactifs)
        .andWhere("p.Name NOT LIKE :name2", { name2: `%DEPASSEMENT%` }) // Exclure les produits contenant "LIvRAISON" (avec I majuscule pour éviter de confondre avec les produits contenant "livraison" qui sont des réactifs)
        .orderBy("p.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const products = await qb.getMany();

      return products.map(p => ({
        ...p,
        measures:
          (p as ProductNew & { measures?: MeasureNew[] }).measures || [],
      }));
    } catch (error) {
      this.logger.error(
        `Erreur lors de la récupération des produits compteurs avec mesures`,
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Supprimer les mesures entrants entre deux dates
   * Join avec import_tonnage (apporteurs/moralEntities)
   * Si deleteAll = true, supprime toutes les mesures avec ProducerId != 0 et != null
   */
  async deleteMeasuresEntrants(
    startDate: Date,
    endDate: Date,
    idUsine: number,
    deleteAll: boolean = false
  ): Promise<{ deleted: number }> {
    try {
      if (deleteAll) {
        // Supprimer toutes les mesures avec ProducerId != 0 et != null
        const result = await this.measureNewRepository
          .createQueryBuilder()
          .delete()
          .from(MeasureNew)
          .where("ProducerId IS NOT NULL")
          .andWhere("ProducerId != 0")
          .execute();

        this.logger.log(
          `${result.affected} mesures entrants supprimées (toutes avec ProducerId != 0 et != null)`,
          "ProductsService"
        );

        return { deleted: result.affected || 0 };
      }

      // Comportement par défaut : suppression entre deux dates
      // Ajuster startDate pour commencer à 00:00:00.000
      const startDateAdjusted = new Date(startDate);
      startDateAdjusted.setHours(0, 0, 0, 0);

      // Ajuster endDate pour inclure toute la journée (23:59:59.999)
      const endDateAdjusted = new Date(endDate);
      endDateAdjusted.setHours(23, 59, 59, 999);

      // Récupérer les ProducerIds depuis import_tonnage pour cette usine
      const importTonnages = await this.importTonnageRepository.find({
        where: { idUsine },
        select: ["ProducerId"],
      });

      const producerIds = [...new Set(importTonnages.map(it => it.ProducerId))];

      if (producerIds.length === 0) {
        return { deleted: 0 };
      }

      const result = await this.measureNewRepository
        .createQueryBuilder()
        .delete()
        .from(MeasureNew)
        .where("ProducerId IN (:...producerIds)", { producerIds })
        .andWhere("EntryDate >= :startDate", { startDate: startDateAdjusted })
        .andWhere("EntryDate <= :endDate", { endDate: endDateAdjusted })
        .execute();

      this.logger.log(
        `${result.affected} mesures entrants supprimées entre ${startDate.toISOString()} et ${endDate.toISOString()}`,
        "ProductsService"
      );

      return { deleted: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la suppression des mesures entrants",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Supprimer les mesures sortants entre deux dates
   * Join avec import_tonnageSortants
   * Si deleteAll = true, supprime toutes les mesures de produits avec Enabled=1 et typeId=5
   */
  async deleteMeasuresSortants(
    startDate: Date,
    endDate: Date,
    idUsine: number,
    deleteAll: boolean = false
  ): Promise<{ deleted: number }> {
    try {
      if (deleteAll) {
        // Récupérer les ProductIds des produits avec Enabled=1 et typeId=5
        const products = await this.productsRepository.find({
          where: {
            idUsine,
            Enabled: 1,
            typeId: 5,
          },
          select: ["id"],
        });

        const productIds = products.map(p => p.id);

        if (productIds.length === 0) {
          return { deleted: 0 };
        }

        const result = await this.measureNewRepository
          .createQueryBuilder()
          .delete()
          .from(MeasureNew)
          .where("ProductId IN (:...productIds)", { productIds })
          .execute();

        this.logger.log(
          `${result.affected} mesures sortants supprimées (toutes avec Enabled=1 et typeId=5)`,
          "ProductsService"
        );

        return { deleted: result.affected || 0 };
      }

      // Comportement par défaut : suppression entre deux dates
      // Ajuster startDate pour commencer à 00:00:00.000
      const startDateAdjusted = new Date(startDate);
      startDateAdjusted.setHours(0, 0, 0, 0);

      // Ajuster endDate pour inclure toute la journée (23:59:59.999)
      const endDateAdjusted = new Date(endDate);
      endDateAdjusted.setHours(23, 59, 59, 999);

      // Récupérer les ProductIds depuis import_tonnageSortants pour cette usine
      const importSortants = await this.importTonnageSortantRepository.find({
        where: { idUsine },
        select: ["ProductId"],
      });

      const productIds = [...new Set(importSortants.map(is => is.ProductId))];

      if (productIds.length === 0) {
        return { deleted: 0 };
      }

      const result = await this.measureNewRepository
        .createQueryBuilder()
        .delete()
        .from(MeasureNew)
        .where("ProductId IN (:...productIds)", { productIds })
        .andWhere("EntryDate >= :startDate", { startDate: startDateAdjusted })
        .andWhere("EntryDate <= :endDate", { endDate: endDateAdjusted })
        .execute();

      this.logger.log(
        `${result.affected} mesures sortants supprimées entre ${startDate.toISOString()} et ${endDate.toISOString()}`,
        "ProductsService"
      );

      return { deleted: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la suppression des mesures sortants",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Supprimer les mesures réactifs entre deux dates
   * Join avec import_tonnageReactifs
   * Si deleteAll = true, supprime toutes les mesures de produits avec Enabled=1 et Name LIKE '%livraison%'
   */
  async deleteMeasuresReactifs(
    startDate: Date,
    endDate: Date,
    idUsine: number,
    deleteAll: boolean = false
  ): Promise<{ deleted: number }> {
    try {
      if (deleteAll) {
        // Récupérer les ProductIds des produits avec Enabled=1 et Name LIKE '%livraison%'
        const products = await this.productsRepository.find({
          where: {
            idUsine,
            Enabled: 1,
            Name: Like(`%livraison%`),
          },
          select: ["id"],
        });

        const productIds = products.map(p => p.id);

        if (productIds.length === 0) {
          return { deleted: 0 };
        }

        const result = await this.measureNewRepository
          .createQueryBuilder()
          .delete()
          .from(MeasureNew)
          .where("ProductId IN (:...productIds)", { productIds })
          .execute();

        this.logger.log(
          `${result.affected} mesures réactifs supprimées (toutes avec Enabled=1 et Name LIKE '%livraison%')`,
          "ProductsService"
        );

        return { deleted: result.affected || 0 };
      }

      // Comportement par défaut : suppression entre deux dates
      // Ajuster startDate pour commencer à 00:00:00.000
      const startDateAdjusted = new Date(startDate);
      startDateAdjusted.setHours(0, 0, 0, 0);

      // Ajuster endDate pour inclure toute la journée (23:59:59.999)
      const endDateAdjusted = new Date(endDate);
      endDateAdjusted.setHours(23, 59, 59, 999);

      // Récupérer les ProductIds depuis import_tonnageReactifs pour cette usine
      const importReactifs = await this.importTonnageReactifRepository.find({
        where: { idUsine },
        select: ["ProductId"],
      });

      const productIds = [...new Set(importReactifs.map(ir => ir.ProductId))];

      if (productIds.length === 0) {
        return { deleted: 0 };
      }

      const result = await this.measureNewRepository
        .createQueryBuilder()
        .delete()
        .from(MeasureNew)
        .where("ProductId IN (:...productIds)", { productIds })
        .andWhere("EntryDate >= :startDate", { startDate: startDateAdjusted })
        .andWhere("EntryDate <= :endDate", { endDate: endDateAdjusted })
        .execute();

      this.logger.log(
        `${result.affected} mesures réactifs supprimées entre ${startDate.toISOString()} et ${endDate.toISOString()}`,
        "ProductsService"
      );

      return { deleted: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la suppression des mesures réactifs",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  // ===================================================================
  // CATEGORIES (pour la création de produits)
  // ===================================================================

  /**
   * Récupérer les catégories pour les compteurs
   */
  async findCategoriesCompteurs(): Promise<CategorieNew[]> {
    try {
      return this.categorieNewRepository
        .createQueryBuilder("cat")
        .leftJoinAndSelect(CategorieNew, "cat2", "cat.ParentId = cat2.id")
        .select([
          "cat.id AS id",
          "cat.CreateDate AS CreateDate",
          "cat.LastModifiedDate AS LastModifiedDate",
          "cat.Name AS Name",
          "cat.Enabled AS Enabled",
          "cat.Code AS Code",
          "cat.ParentId AS ParentId",
          "cat2.Name AS ParentName",
        ])
        .where("cat.Enabled = 1")
        .andWhere("LEN(cat.Code) > 1")
        .andWhere("cat.Name NOT LIKE :tonnage", { tonnage: "Tonnage%" })
        .andWhere("cat.Name NOT LIKE :cendres", { cendres: "Cendres%" })
        .andWhere("cat.Code NOT LIKE :code701", { code701: "701%" })
        .andWhere("cat.Name NOT LIKE :machefers", { machefers: "Mâchefers%" })
        .andWhere("cat.Name NOT LIKE :arrets", { arrets: "Arrêts%" })
        .andWhere("cat.Name NOT LIKE :autresConso", {
          autresConso: "Autres consommables%",
        })
        .andWhere("cat.Name NOT LIKE :dechets", {
          dechets: "Déchets détournés%",
        })
        .andWhere("cat.Name NOT LIKE :ferraille", {
          ferraille: "Ferraille et autres%",
        })
        .andWhere("cat.Name NOT LIKE :analyses", { analyses: "Analyses%" })
        .orderBy("cat.Name", "ASC")
        .getRawMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des catégories compteurs",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les catégories pour les analyses
   */
  async findCategoriesAnalyses(): Promise<CategorieNew[]> {
    try {
      return this.categorieNewRepository
        .createQueryBuilder("cat")
        .leftJoinAndSelect(CategorieNew, "cat2", "cat.ParentId = cat2.id")
        .select([
          "cat.id AS id",
          "cat.CreateDate AS CreateDate",
          "cat.LastModifiedDate AS LastModifiedDate",
          "cat.Name AS Name",
          "cat.Enabled AS Enabled",
          "cat.Code AS Code",
          "cat.ParentId AS ParentId",
          "cat2.Name AS ParentName",
        ])
        .where("cat.Enabled = 1")
        .andWhere("LEN(cat.Code) > 1")
        .andWhere("cat.Name LIKE :analyses", { analyses: "Analyses%" })
        .orderBy("cat.Name", "ASC")
        .getRawMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des catégories analyses",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer les catégories pour les sortants
   */
  async findCategoriesSortants(): Promise<CategorieNew[]> {
    try {
      return this.categorieNewRepository
        .createQueryBuilder("cat")
        .leftJoinAndSelect(CategorieNew, "cat2", "cat.ParentId = cat2.id")
        .select([
          "cat.id AS id",
          "cat.CreateDate AS CreateDate",
          "cat.LastModifiedDate AS LastModifiedDate",
          "cat.Name AS Name",
          "cat.Enabled AS Enabled",
          "cat.Code AS Code",
          "cat.ParentId AS ParentId",
          "cat2.Name AS ParentName",
        ])
        .where("cat.Code LIKE :code", { code: "50%" })
        .andWhere("cat.Name NOT LIKE :residus", {
          residus: "Résidus de Traitement",
        })
        .orderBy("cat.Name", "ASC")
        .getRawMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des catégories sortants",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer le dernier code produit pour un préfixe donné
   */
  async findLastProductCode(
    codePrefix: string,
    idUsine?: number
  ): Promise<string | null> {
    try {
      const qb = this.productsRepository
        .createQueryBuilder("p")
        .select("p.Code", "Code")
        .where("p.Code LIKE :codePattern", {
          codePattern: `${codePrefix}%`,
        })
        .orderBy("p.Code", "DESC")
        .limit(1);

      if (idUsine) {
        qb.andWhere("p.idUsine = :idUsine", { idUsine });
      }

      const result = await qb.getRawOne();
      return result?.Code ?? null;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération du dernier code produit",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Récupérer le dernier code produit parmi TOUS les sites
   */
  async findLastProductCodeAllSites(
    codePrefix: string
  ): Promise<string | null> {
    try {
      const result = await this.productsRepository
        .createQueryBuilder("p")
        .select("p.Code", "Code")
        .where("p.Code LIKE :codePattern", {
          codePattern: `${codePrefix}%`,
        })
        .orderBy("p.Code", "DESC")
        .limit(1)
        .getRawOne();

      return result?.Code ?? null;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération du dernier code produit (tous sites)",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Créer un produit sur tous les sites
   * Pour les sortants, analyses et consommables
   */
  async createOnAllSites(
    createDto: CreateProductDto,
    categoryId: number
  ): Promise<ProductNew[]> {
    try {
      const sites = await this.siteRepository.find();
      const now = new Date();
      const createdProducts: ProductNew[] = [];

      for (const site of sites) {
        const product = this.productsRepository.create({
          ...createDto,
          idUsine: site.id,
          CreateDate: now,
          LastModifiedDate: now,
          Enabled: 1,
        });

        const savedProduct = await this.productsRepository.save(product);

        // Créer l'association produit-catégorie
        const productCategorie = this.productCategorieNewRepository.create({
          ProductId: savedProduct.id,
          CategoryId: categoryId,
        });
        await this.productCategorieNewRepository.save(productCategorie);

        createdProducts.push(savedProduct);
      }

      this.logger.log(
        `Produit créé sur ${createdProducts.length} sites`,
        "ProductsService"
      );

      return createdProducts;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du produit sur tous les sites",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }

  /**
   * Créer un produit sur un site spécifique (pour compteurs)
   */
  async createOnSite(
    createDto: CreateProductDto,
    categoryId: number
  ): Promise<ProductNew> {
    try {
      const now = new Date();
      const product = this.productsRepository.create({
        ...createDto,
        CreateDate: now,
        LastModifiedDate: now,
        Enabled: 1,
      });

      const savedProduct = await this.productsRepository.save(product);

      // Créer l'association produit-catégorie
      const productCategorie = this.productCategorieNewRepository.create({
        ProductId: savedProduct.id,
        CategoryId: categoryId,
      });
      await this.productCategorieNewRepository.save(productCategorie);

      this.logger.log(
        `Produit créé avec succès sur le site ${createDto.idUsine}: ${savedProduct.id}`,
        "ProductsService"
      );

      return savedProduct;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du produit sur un site",
        error instanceof Error ? error.stack : String(error),
        "ProductsService"
      );
      throw error;
    }
  }
}
