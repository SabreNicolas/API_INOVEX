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
import { Site } from "../../entities";
import { CreateSiteDto, UpdateSiteDto } from "./dto";

@Injectable()
export class SiteService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    private readonly logger: LoggerService
  ) {}

  async findAll(
    pagination?: PaginationDto
  ): Promise<PaginatedResult<Site> | Site[]> {
    try {
      if (!pagination) {
        const sites = await this.siteRepository.find({
          order: { id: "ASC" },
          take: PAGINATION_DEFAULTS.MAX_LIMIT,
        });
        return sites;
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
        "SiteService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Site> {
    try {
      const site = await this.siteRepository.findOne({
        where: { id },
      });

      if (!site) {
        throw new NotFoundException(`Site avec l'ID ${id} non trouvé`);
      }

      return site;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération du site",
        error instanceof Error ? error.stack : String(error),
        "SiteService"
      );
      throw error;
    }
  }

  async create(createSiteDto: CreateSiteDto): Promise<{ id: number }> {
    try {
      const site = this.siteRepository.create({
        localisation: createSiteDto.localisation,
        codeUsine: createSiteDto.codeUsine,
        nbLigne: createSiteDto.nbLigne ?? null,
        nbGTA: createSiteDto.nbGTA ?? null,
        nbReseauChaleur: createSiteDto.nbReseauChaleur ?? null,
        typeImport: createSiteDto.typeImport ?? null,
        typeRondier: createSiteDto.typeRondier ?? "A",
        ipAveva: createSiteDto.ipAveva ?? "",
        validationDonnees: createSiteDto.validationDonnees ?? 0,
        debutQuartMatin: createSiteDto.debutQuartMatin ?? "05:00",
        finQuartMatin: createSiteDto.finQuartMatin ?? "13:00",
        debutQuartAM: createSiteDto.debutQuartAM ?? "13:00",
        finQuartAM: createSiteDto.finQuartAM ?? "21:00",
        debutQuartNuit: createSiteDto.debutQuartNuit ?? "21:00",
        finQuartNuit: createSiteDto.finQuartNuit ?? "05:00",
        margeHeuresQuart: createSiteDto.margeHeuresQuart ?? 2,
      });

      const savedSite = await this.siteRepository.save(site);

      this.logger.log(
        `Site créé: ${savedSite.localisation} (${savedSite.codeUsine})`,
        "SiteService"
      );

      return { id: savedSite.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création du site",
        error instanceof Error ? error.stack : String(error),
        "SiteService"
      );
      throw error;
    }
  }

  async update(id: number, updateSiteDto: UpdateSiteDto): Promise<void> {
    try {
      const existing = await this.siteRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(`Site avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<Site> = {};

      if (updateSiteDto.localisation !== undefined)
        updateData.localisation = updateSiteDto.localisation;
      if (updateSiteDto.codeUsine !== undefined)
        updateData.codeUsine = updateSiteDto.codeUsine;
      if (updateSiteDto.nbLigne !== undefined)
        updateData.nbLigne = updateSiteDto.nbLigne;
      if (updateSiteDto.nbGTA !== undefined)
        updateData.nbGTA = updateSiteDto.nbGTA;
      if (updateSiteDto.nbReseauChaleur !== undefined)
        updateData.nbReseauChaleur = updateSiteDto.nbReseauChaleur;
      if (updateSiteDto.typeImport !== undefined)
        updateData.typeImport = updateSiteDto.typeImport;
      if (updateSiteDto.typeRondier !== undefined)
        updateData.typeRondier = updateSiteDto.typeRondier;
      if (updateSiteDto.ipAveva !== undefined)
        updateData.ipAveva = updateSiteDto.ipAveva;
      if (updateSiteDto.validationDonnees !== undefined)
        updateData.validationDonnees = updateSiteDto.validationDonnees;
      if (updateSiteDto.debutQuartMatin !== undefined)
        updateData.debutQuartMatin = updateSiteDto.debutQuartMatin;
      if (updateSiteDto.finQuartMatin !== undefined)
        updateData.finQuartMatin = updateSiteDto.finQuartMatin;
      if (updateSiteDto.debutQuartAM !== undefined)
        updateData.debutQuartAM = updateSiteDto.debutQuartAM;
      if (updateSiteDto.finQuartAM !== undefined)
        updateData.finQuartAM = updateSiteDto.finQuartAM;
      if (updateSiteDto.debutQuartNuit !== undefined)
        updateData.debutQuartNuit = updateSiteDto.debutQuartNuit;
      if (updateSiteDto.finQuartNuit !== undefined)
        updateData.finQuartNuit = updateSiteDto.finQuartNuit;
      if (updateSiteDto.margeHeuresQuart !== undefined)
        updateData.margeHeuresQuart = updateSiteDto.margeHeuresQuart;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("Aucune donnée à mettre à jour");
      }

      await this.siteRepository.update({ id }, updateData);

      this.logger.log(`Site ${id} mis à jour`, "SiteService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du site",
        error instanceof Error ? error.stack : String(error),
        "SiteService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.siteRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(`Site avec l'ID ${id} non trouvé`);
      }

      await this.siteRepository.delete({ id });

      this.logger.log(`Site ${id} supprimé`, "SiteService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du site",
        error instanceof Error ? error.stack : String(error),
        "SiteService"
      );
      throw error;
    }
  }
}
