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
  MeasureNew,
  MoralEntityNew,
  ProductNew,
  TypeNew,
} from "../../entities";
import {
  CreateMeasureDto,
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
    private readonly logger: LoggerService
  ) {}

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
      const whereCondition = idUsine ? { Id: id, idUsine } : { Id: id };

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
        `Produit créé avec succès: ${savedProduct.Id}`,
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
        `Produit mis à jour avec succès: ${savedProduct.Id}`,
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
      const whereCondition = idUsine ? { Id: id, idUsine } : { Id: id };

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
      console.log("ID Usine pour findAllSortants:", idUsine); // Log de debug pour vérifier l'ID usine
      if (!pagination) {
        const imports = await this.productsRepository.find({
          where: idUsine
            ? { idUsine, Enabled: 1, typeId: 5 }
            : { Enabled: 1, typeId: 5 },
          order: { Id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
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
          order: { Id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
          relations: ["elementRondier"],
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
        `Mesure créée avec succès: ${savedMeasure.Id}`,
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
   * Mettre à jour une mesure
   */
  async updateMeasure(
    id: number,
    updateDto: UpdateMeasureDto
  ): Promise<MeasureNew> {
    try {
      const measure = await this.measureNewRepository.findOne({
        where: { Id: id },
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
        `Mesure mise à jour avec succès: ${savedMeasure.Id}`,
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
          "m.ProducerId = me.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .orderBy("me.Name", "ASC")
        .addOrderBy("m.EntryDate", "ASC");

      if (idUsine) {
        qb.where("me.idUsine = :idUsine and me.Enabled = 1", { idUsine });
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
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
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
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
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
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
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
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
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
          "m.ProductId = p.Id AND m.EntryDate BETWEEN :startDate AND :endDate",
          { startDate, endDate }
        )
        .where("p.Enabled = 1")
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
}
