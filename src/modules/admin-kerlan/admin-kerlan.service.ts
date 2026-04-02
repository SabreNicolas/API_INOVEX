import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { PAGINATION_DEFAULTS } from "../../common/constants";
import {
  createPaginatedResult,
  PaginatedResult,
  PaginationDto,
} from "../../common/dto/pagination.dto";
import { LoggerService } from "../../common/services/logger.service";
import {
  ConsigneType,
  Conversion,
  PosteRondier,
  QuartEvenementCause,
  Rapport,
  Site,
} from "../../entities";
import {
  CreateConsigneTypeDto,
  CreateConversionDto,
  CreatePosteRondierDto,
  CreateQuartEvenementCauseDto,
  CreateRapportDto,
  CreateSiteDto,
  UpdateConsigneTypeDto,
  UpdateConversionDto,
  UpdatePosteRondierDto,
  UpdateQuartEvenementCauseDto,
  UpdateRapportDto,
  UpdateSiteDto,
} from "./dto";

@Injectable()
export class AdminKerlanService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(ConsigneType)
    private readonly consigneTypeRepository: Repository<ConsigneType>,
    @InjectRepository(QuartEvenementCause)
    private readonly quartEvenementCauseRepository: Repository<QuartEvenementCause>,
    @InjectRepository(Rapport)
    private readonly rapportRepository: Repository<Rapport>,
    @InjectRepository(PosteRondier)
    private readonly posteRondierRepository: Repository<PosteRondier>,
    @InjectRepository(Conversion)
    private readonly conversionRepository: Repository<Conversion>,
    private readonly logger: LoggerService
  ) {}

  // ==================== SITES ====================

  async findAllSites(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Site> | Site[]> {
    try {
      if (!pagination) {
        return this.siteRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [sites, total] = await this.siteRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(sites, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des sites",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOneSite(id: number): Promise<Site> {
    const site = await this.siteRepository.findOne({ where: { id } });
    if (!site) {
      throw new NotFoundException(`Site avec l'ID ${id} non trouvé`);
    }
    return site;
  }

  async createSite(dto: CreateSiteDto): Promise<{ id: number }> {
    try {
      const site = this.siteRepository.create({
        localisation: dto.localisation,
        codeUsine: dto.codeUsine,
        nbLigne: dto.nbLigne ?? null,
        nbGTA: dto.nbGTA ?? null,
        nbReseauChaleur: dto.nbReseauChaleur ?? null,
        typeImport: dto.typeImport ?? null,
        typeRondier: dto.typeRondier ?? "A",
        ipAveva: dto.ipAveva ?? "",
        validationDonnees: dto.validationDonnees ?? 0,
        debutQuartMatin: dto.debutQuartMatin ?? "05:00",
        finQuartMatin: dto.finQuartMatin ?? "13:00",
        debutQuartAM: dto.debutQuartAM ?? "13:00",
        finQuartAM: dto.finQuartAM ?? "21:00",
        debutQuartNuit: dto.debutQuartNuit ?? "21:00",
        finQuartNuit: dto.finQuartNuit ?? "05:00",
        margeHeuresQuart: dto.margeHeuresQuart ?? 2,
      });

      const saved = await this.siteRepository.save(site);
      this.logger.log(`Site créé avec l'ID ${saved.id}`, "AdminKerlanService");
      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du site",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async updateSite(id: number, dto: UpdateSiteDto): Promise<void> {
    const site = await this.findOneSite(id);
    Object.assign(site, dto);
    await this.siteRepository.save(site);
    this.logger.log(`Site ${id} mis à jour`, "AdminKerlanService");
  }

  // ==================== CONSIGNE TYPES ====================

  async findAllConsigneTypes(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<ConsigneType> | ConsigneType[]> {
    try {
      if (!pagination) {
        return this.consigneTypeRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] = await this.consigneTypeRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des types de consigne",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOneConsigneType(id: number): Promise<ConsigneType> {
    const item = await this.consigneTypeRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(
        `Type de consigne avec l'ID ${id} non trouvé`
      );
    }
    return item;
  }

  async createConsigneType(
    dto: CreateConsigneTypeDto
  ): Promise<{ id: number }> {
    const item = this.consigneTypeRepository.create(dto);
    const saved = await this.consigneTypeRepository.save(item);
    this.logger.log(
      `Type de consigne créé avec l'ID ${saved.id}`,
      "AdminKerlanService"
    );
    return { id: saved.id };
  }

  async updateConsigneType(
    id: number,
    dto: UpdateConsigneTypeDto
  ): Promise<void> {
    const item = await this.findOneConsigneType(id);
    Object.assign(item, dto);
    await this.consigneTypeRepository.save(item);
    this.logger.log(`Type de consigne ${id} mis à jour`, "AdminKerlanService");
  }

  async deleteConsigneType(id: number): Promise<void> {
    const item = await this.findOneConsigneType(id);
    await this.consigneTypeRepository.remove(item);
    this.logger.log(`Type de consigne ${id} supprimé`, "AdminKerlanService");
  }

  // ==================== QUART EVENEMENT CAUSES ====================

  async findAllQuartEvenementCauses(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<QuartEvenementCause> | QuartEvenementCause[]> {
    try {
      if (!pagination) {
        return this.quartEvenementCauseRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] =
        await this.quartEvenementCauseRepository.findAndCount({
          order: { id: "ASC" },
          skip: offset,
          take: limit,
        });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des causes d'événement",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOneQuartEvenementCause(id: number): Promise<QuartEvenementCause> {
    const item = await this.quartEvenementCauseRepository.findOne({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(
        `Cause d'événement avec l'ID ${id} non trouvée`
      );
    }
    return item;
  }

  async createQuartEvenementCause(
    dto: CreateQuartEvenementCauseDto
  ): Promise<{ id: number }> {
    const item = this.quartEvenementCauseRepository.create(dto);
    const saved = await this.quartEvenementCauseRepository.save(item);
    this.logger.log(
      `Cause d'événement créée avec l'ID ${saved.id}`,
      "AdminKerlanService"
    );
    return { id: saved.id };
  }

  async updateQuartEvenementCause(
    id: number,
    dto: UpdateQuartEvenementCauseDto
  ): Promise<void> {
    const item = await this.findOneQuartEvenementCause(id);
    Object.assign(item, dto);
    await this.quartEvenementCauseRepository.save(item);
    this.logger.log(
      `Cause d'événement ${id} mise à jour`,
      "AdminKerlanService"
    );
  }

  async deleteQuartEvenementCause(id: number): Promise<void> {
    const item = await this.findOneQuartEvenementCause(id);
    await this.quartEvenementCauseRepository.remove(item);
    this.logger.log(`Cause d'événement ${id} supprimée`, "AdminKerlanService");
  }

  // ==================== RAPPORTS ====================

  async findAllRapports(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Rapport> | Rapport[]> {
    try {
      if (!pagination) {
        return this.rapportRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] = await this.rapportRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des rapports",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOneRapport(id: number): Promise<Rapport> {
    const item = await this.rapportRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Rapport avec l'ID ${id} non trouvé`);
    }
    return item;
  }

  async createRapport(dto: CreateRapportDto): Promise<{ id: number }> {
    // Vérifier que le site existe
    await this.findOneSite(dto.idUsine);

    const item = this.rapportRepository.create(dto);
    const saved = await this.rapportRepository.save(item);
    this.logger.log(`Rapport créé avec l'ID ${saved.id}`, "AdminKerlanService");
    return { id: saved.id };
  }

  async updateRapport(id: number, dto: UpdateRapportDto): Promise<void> {
    const item = await this.findOneRapport(id);

    // Vérifier que le site existe si changement
    if (dto.idUsine && dto.idUsine !== item.idUsine) {
      await this.findOneSite(dto.idUsine);
    }

    Object.assign(item, dto);
    await this.rapportRepository.save(item);
    this.logger.log(`Rapport ${id} mis à jour`, "AdminKerlanService");
  }

  async deleteRapport(id: number): Promise<void> {
    const item = await this.findOneRapport(id);
    await this.rapportRepository.remove(item);
    this.logger.log(`Rapport ${id} supprimé`, "AdminKerlanService");
  }

  // ==================== POSTES RONDIER ====================

  async findAllPostesRondier(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<PosteRondier> | PosteRondier[]> {
    try {
      if (!pagination) {
        return this.posteRondierRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] = await this.posteRondierRepository.findAndCount({
        order: { id: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des postes rondier",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOnePosteRondier(id: number): Promise<PosteRondier> {
    const item = await this.posteRondierRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Poste rondier avec l'ID ${id} non trouvé`);
    }
    return item;
  }

  async createPosteRondier(
    dto: CreatePosteRondierDto
  ): Promise<{ id: number }> {
    const item = this.posteRondierRepository.create(dto);
    const saved = await this.posteRondierRepository.save(item);
    this.logger.log(
      `Poste rondier créé avec l'ID ${saved.id}`,
      "AdminKerlanService"
    );
    return { id: saved.id };
  }

  async updatePosteRondier(
    id: number,
    dto: UpdatePosteRondierDto
  ): Promise<void> {
    const item = await this.findOnePosteRondier(id);
    Object.assign(item, dto);
    await this.posteRondierRepository.save(item);
    this.logger.log(`Poste rondier ${id} mis à jour`, "AdminKerlanService");
  }

  async deletePosteRondier(id: number): Promise<void> {
    const item = await this.findOnePosteRondier(id);
    await this.posteRondierRepository.remove(item);
    this.logger.log(`Poste rondier ${id} supprimé`, "AdminKerlanService");
  }

  // ==================== CONVERSIONS ====================

  async findAllConversions(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Conversion> | Conversion[]> {
    try {
      if (!pagination) {
        return this.conversionRepository.find({
          order: { uniteBase: "ASC", uniteCible: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
      }

      const { page = 1, limit = 20 } = pagination;
      const offset = (page - 1) * limit;

      const [items, total] = await this.conversionRepository.findAndCount({
        order: { uniteBase: "ASC", uniteCible: "ASC" },
        skip: offset,
        take: limit,
      });

      return createPaginatedResult(items, total, page, limit);
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des conversions",
        error instanceof Error ? error.stack : String(error),
        "AdminKerlanService"
      );
      throw error;
    }
  }

  async findOneConversion(
    uniteBase: string,
    uniteCible: string
  ): Promise<Conversion> {
    const item = await this.conversionRepository.findOne({
      where: { uniteBase, uniteCible },
    });
    if (!item) {
      throw new NotFoundException(
        `Conversion ${uniteBase} -> ${uniteCible} non trouvée`
      );
    }
    return item;
  }

  async createConversion(
    dto: CreateConversionDto
  ): Promise<{ uniteBase: string; uniteCible: string }> {
    // Vérifier si la conversion existe déjà
    const existing = await this.conversionRepository.findOne({
      where: { uniteBase: dto.uniteBase, uniteCible: dto.uniteCible },
    });
    if (existing) {
      throw new BadRequestException(
        `La conversion ${dto.uniteBase} -> ${dto.uniteCible} existe déjà`
      );
    }

    const item = this.conversionRepository.create(dto);
    const saved = await this.conversionRepository.save(item);
    this.logger.log(
      `Conversion ${saved.uniteBase} -> ${saved.uniteCible} créée`,
      "AdminKerlanService"
    );
    return { uniteBase: saved.uniteBase, uniteCible: saved.uniteCible };
  }

  async updateConversion(
    uniteBase: string,
    uniteCible: string,
    dto: UpdateConversionDto
  ): Promise<void> {
    const item = await this.findOneConversion(uniteBase, uniteCible);
    if (dto.conversion) {
      item.conversion = dto.conversion;
    }
    await this.conversionRepository.save(item);
    this.logger.log(
      `Conversion ${uniteBase} -> ${uniteCible} mise à jour`,
      "AdminKerlanService"
    );
  }

  async deleteConversion(uniteBase: string, uniteCible: string): Promise<void> {
    const item = await this.findOneConversion(uniteBase, uniteCible);
    await this.conversionRepository.remove(item);
    this.logger.log(
      `Conversion ${uniteBase} -> ${uniteCible} supprimée`,
      "AdminKerlanService"
    );
  }
}
