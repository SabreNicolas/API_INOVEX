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
import { ProductNew, TypeNew } from "../../entities";
import { CreateProductDto, UpdateProductDto } from "./dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductNew)
    private readonly productsRepository: Repository<ProductNew>,
    @InjectRepository(TypeNew)
    private readonly typeNewRepository: Repository<TypeNew>,
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
}
