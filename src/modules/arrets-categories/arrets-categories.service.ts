import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  ArretArretCategorie,
  ArretCategorie,
  ArretCategorieSousCategorie,
  ArretSousCategorie,
} from "@/entities";

import {
  CreateArretArretCategorieDto,
  CreateArretCategorieDto,
  CreateArretCategorieSousCategorieDto,
  CreateArretSousCategorieDto,
  UpdateArretCategorieDto,
  UpdateArretSousCategorieDto,
} from "./dto";

@Injectable()
export class ArretsCategoriesService {
  constructor(
    @InjectRepository(ArretCategorie)
    private readonly categorieRepo: Repository<ArretCategorie>,
    @InjectRepository(ArretSousCategorie)
    private readonly sousCategorieRepo: Repository<ArretSousCategorie>,
    @InjectRepository(ArretArretCategorie)
    private readonly arretArretCategorieRepo: Repository<ArretArretCategorie>,
    @InjectRepository(ArretCategorieSousCategorie)
    private readonly categorieSousCategorieRepo: Repository<ArretCategorieSousCategorie>,
    private readonly logger: LoggerService
  ) {}

  // ========== Catégories ==========

  async findAllCategories(): Promise<ArretCategorie[]> {
    return this.categorieRepo.find({ order: { nom: "ASC" } });
  }

  async findOneCategorie(id: number): Promise<ArretCategorie> {
    const categorie = await this.categorieRepo.findOne({ where: { id } });
    if (!categorie) {
      throw new NotFoundException(
        `Catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    return categorie;
  }

  async createCategorie(dto: CreateArretCategorieDto): Promise<ArretCategorie> {
    console.log("DTO reçu pour création de catégorie d'arrêt:", dto);
    const categorie = this.categorieRepo.create(dto);
    const saved = await this.categorieRepo.save(categorie);
    this.logger.log(
      `Catégorie d'arrêt créée (ID: ${saved.id})`,
      "ArretsCategoriesService"
    );
    return saved;
  }

  async updateCategorie(
    id: number,
    dto: UpdateArretCategorieDto
  ): Promise<void> {
    const existing = await this.categorieRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    await this.categorieRepo.update(id, dto);
    this.logger.log(
      `Catégorie d'arrêt mise à jour: ID ${id}`,
      "ArretsCategoriesService"
    );
  }

  async deleteCategorie(id: number): Promise<void> {
    const existing = await this.categorieRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    await this.categorieRepo.delete(id);
    this.logger.log(
      `Catégorie d'arrêt supprimée: ID ${id}`,
      "ArretsCategoriesService"
    );
  }

  // ========== Sous-Catégories ==========

  async findAllSousCategories(): Promise<ArretSousCategorie[]> {
    return this.sousCategorieRepo.find({ order: { nom: "ASC" } });
  }

  async findOneSousCategorie(id: number): Promise<ArretSousCategorie> {
    const sousCategorie = await this.sousCategorieRepo.findOne({
      where: { id },
    });
    if (!sousCategorie) {
      throw new NotFoundException(
        `Sous-catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    return sousCategorie;
  }

  async createSousCategorie(
    dto: CreateArretSousCategorieDto
  ): Promise<ArretSousCategorie> {
    const sousCategorie = this.sousCategorieRepo.create(dto);
    const saved = await this.sousCategorieRepo.save(sousCategorie);
    this.logger.log(
      `Sous-catégorie d'arrêt créée (ID: ${saved.id})`,
      "ArretsCategoriesService"
    );
    return saved;
  }

  async updateSousCategorie(
    id: number,
    dto: UpdateArretSousCategorieDto
  ): Promise<void> {
    const existing = await this.sousCategorieRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Sous-catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    await this.sousCategorieRepo.update(id, dto);
    this.logger.log(
      `Sous-catégorie d'arrêt mise à jour: ID ${id}`,
      "ArretsCategoriesService"
    );
  }

  async deleteSousCategorie(id: number): Promise<void> {
    const existing = await this.sousCategorieRepo.findOne({ where: { id } });
    if (!existing) {
      throw new NotFoundException(
        `Sous-catégorie d'arrêt avec l'ID ${id} non trouvée`
      );
    }
    await this.sousCategorieRepo.delete(id);
    this.logger.log(
      `Sous-catégorie d'arrêt supprimée: ID ${id}`,
      "ArretsCategoriesService"
    );
  }

  // ========== Liaison Produit <-> Catégorie ==========

  async findAllArretArretCategories(): Promise<ArretArretCategorie[]> {
    return this.arretArretCategorieRepo.find({
      relations: ["arretCategorie"],
    });
  }

  async findArretArretCategoriesByNomContient(
    nomContient: string
  ): Promise<ArretArretCategorie[]> {
    return this.arretArretCategorieRepo.find({
      relations: ["arretCategorie"],
      where: { nomContient },
    });
  }

  async createArretArretCategorie(
    dto: CreateArretArretCategorieDto
  ): Promise<ArretArretCategorie> {
    const entity = this.arretArretCategorieRepo.create({
      nomContient: dto.nomContient,
      importance: dto.importance,
      arretCategorie: { id: dto.idArretsCategories } as ArretCategorie,
    });
    const saved = await this.arretArretCategorieRepo.save(entity);
    this.logger.log(
      `Liaison produit-catégorie créée (ID: ${saved.id})`,
      "ArretsCategoriesService"
    );
    return saved;
  }

  async deleteArretArretCategorie(id: number): Promise<void> {
    const existing = await this.arretArretCategorieRepo.findOne({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Liaison produit-catégorie avec l'ID ${id} non trouvée`
      );
    }
    await this.arretArretCategorieRepo.delete(id);
    this.logger.log(
      `Liaison produit-catégorie supprimée: ID ${id}`,
      "ArretsCategoriesService"
    );
  }

  // ========== Liaison Catégorie <-> Sous-Catégorie ==========

  async findAllCategorieSousCategories(): Promise<
    ArretCategorieSousCategorie[]
  > {
    return this.categorieSousCategorieRepo.find({
      relations: ["arretCategorie", "arretSousCategorie"],
    });
  }

  async findSousCategoriesByCategorie(
    idCategorie: number
  ): Promise<ArretCategorieSousCategorie[]> {
    return this.categorieSousCategorieRepo.find({
      relations: ["arretCategorie", "arretSousCategorie"],
      where: { arretCategorie: { id: idCategorie } },
    });
  }

  async createCategorieSousCategorie(
    dto: CreateArretCategorieSousCategorieDto
  ): Promise<ArretCategorieSousCategorie> {
    const entity = this.categorieSousCategorieRepo.create({
      arretCategorie: { id: dto.idArretsCategories } as ArretCategorie,
      arretSousCategorie: {
        id: dto.idArretsSousCategories,
      } as ArretSousCategorie,
    });
    const saved = await this.categorieSousCategorieRepo.save(entity);
    this.logger.log(
      `Liaison catégorie-sous-catégorie créée (ID: ${saved.id})`,
      "ArretsCategoriesService"
    );
    return saved;
  }

  async deleteCategorieSousCategorie(id: number): Promise<void> {
    const existing = await this.categorieSousCategorieRepo.findOne({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(
        `Liaison catégorie-sous-catégorie avec l'ID ${id} non trouvée`
      );
    }
    await this.categorieSousCategorieRepo.delete(id);
    this.logger.log(
      `Liaison catégorie-sous-catégorie supprimée: ID ${id}`,
      "ArretsCategoriesService"
    );
  }
}
