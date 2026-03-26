import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as archiver from "archiver";
import { createReadStream, existsSync } from "fs";
import { basename, resolve } from "path";
import { PassThrough } from "stream";
import { Brackets, Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Consigne,
  ModeOperatoire,
  QuartEvenement,
  Site,
  ZoneControle,
} from "../../entities";
import { ExportFilesDto, FileCategory } from "./dto";

interface FileInfo {
  filePath: string;
  siteName: string;
  siteId: number;
  fileName: string;
}

@Injectable()
export class ExportService {
  private readonly uploadsRoot = resolve(process.cwd(), "uploads");

  constructor(
    @InjectRepository(Consigne)
    private readonly consigneRepository: Repository<Consigne>,
    @InjectRepository(QuartEvenement)
    private readonly quartEvenementRepository: Repository<QuartEvenement>,
    @InjectRepository(ModeOperatoire)
    private readonly modeOperatoireRepository: Repository<ModeOperatoire>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    private readonly logger: LoggerService
  ) {}

  async exportFiles(
    dto: ExportFilesDto
  ): Promise<{ stream: PassThrough; filename: string }> {
    const { category, years, months, siteIds } = dto;

    // Récupérer les sites
    const sites = await this.getSites(siteIds);
    if (sites.length === 0) {
      throw new NotFoundException("Aucun site trouvé");
    }

    // Récupérer les fichiers selon la catégorie
    let files: FileInfo[] = [];

    switch (category) {
      case FileCategory.CONSIGNES:
        files = await this.getConsigneFiles(years, months, sites);
        break;
      case FileCategory.QUART_EVENEMENTS:
        files = await this.getQuartEvenementFiles(years, months, sites);
        break;
      case FileCategory.MODE_OPERATOIRE:
        files = await this.getModeOperatoireFiles(sites);
        break;
    }

    if (files.length === 0) {
      throw new NotFoundException(
        "Aucun fichier trouvé pour les critères spécifiés"
      );
    }

    this.logger.log(
      `Export: ${files.length} fichier(s) trouvé(s) en base`,
      "ExportService"
    );

    // Créer le ZIP
    const archive = archiver("zip", { zlib: { level: 9 } });
    const passThrough = new PassThrough();

    archive.pipe(passThrough);

    // Gestion des erreurs d'archive
    archive.on("error", err => {
      this.logger.error(
        `Erreur archive: ${err.message}`,
        err.stack,
        "ExportService"
      );
    });

    // Grouper les fichiers par site
    const filesBySite = this.groupFilesBySite(files);
    let addedFiles = 0;

    for (const [siteName, siteFiles] of filesBySite.entries()) {
      for (const file of siteFiles) {
        const fullPath = this.resolveFilePath(file.filePath, category);

        this.logger.log(
          `Tentative d'ajout: ${file.filePath} -> ${fullPath}`,
          "ExportService"
        );

        // eslint-disable-next-line security/detect-non-literal-fs-filename
        if (existsSync(fullPath)) {
          // Ajouter le fichier dans un dossier par site
          const archivePath = `${siteName}/${file.fileName}`;
          // eslint-disable-next-line security/detect-non-literal-fs-filename
          archive.append(createReadStream(fullPath), { name: archivePath });
          addedFiles++;
          this.logger.log(`Fichier ajouté: ${archivePath}`, "ExportService");
        } else {
          this.logger.warn(
            `Fichier non trouvé sur disque: ${fullPath}`,
            "ExportService"
          );
        }
      }
    }

    if (addedFiles === 0) {
      throw new NotFoundException(
        "Aucun fichier physique trouvé - vérifiez que les fichiers existent sur le serveur"
      );
    }

    // Générer le nom du fichier
    const timestamp = new Date().toISOString().slice(0, 10);
    const yearsStr = years.join("-");
    const monthsStr = months.join("-");
    const filename = `export_${category}_${yearsStr}_mois${monthsStr}_${timestamp}.zip`;

    this.logger.log(
      `Export créé: ${filename} avec ${addedFiles}/${files.length} fichier(s) ajoutés`,
      "ExportService"
    );

    // Finaliser l'archive SANS await - finalize() déclenche l'écriture et ferme le stream
    // Le stream doit être retourné immédiatement pour que les données puissent transiter
    archive.finalize();

    return { stream: passThrough, filename };
  }

  private async getSites(siteIds?: number[]): Promise<Site[]> {
    if (siteIds && siteIds.length > 0) {
      return this.siteRepository
        .createQueryBuilder("site")
        .where("site.id IN (:...ids)", { ids: siteIds })
        .getMany();
    }
    return this.siteRepository.find();
  }

  private async getConsigneFiles(
    years: number[],
    months: number[],
    sites: Site[]
  ): Promise<FileInfo[]> {
    const siteIds = sites.map(s => s.id);
    const siteMap = new Map(sites.map(s => [s.id, s.localisation]));

    const query = this.consigneRepository
      .createQueryBuilder("c")
      .where("c.url IS NOT NULL")
      .andWhere("c.url != ''")
      .andWhere("c.idUsine IN (:...siteIds)", { siteIds })
      .andWhere(
        new Brackets(qb => {
          // Filtrer par années et mois sur date_heure_debut
          qb.where(
            new Brackets(inner => {
              for (const year of years) {
                for (const month of months) {
                  inner.orWhere(
                    `(YEAR(c.date_heure_debut) = :year${year}${month} AND MONTH(c.date_heure_debut) = :month${year}${month})`,
                    {
                      [`year${year}${month}`]: year,
                      [`month${year}${month}`]: month,
                    }
                  );
                }
              }
            })
          );
        })
      );

    const consignes = await query.getMany();

    return consignes
      .filter(c => c.url)
      .map(c => ({
        filePath: c.url!,
        siteName: siteMap.get(c.idUsine) || `Site_${c.idUsine}`,
        siteId: c.idUsine,
        fileName: this.extractFileName(c.url!, c.titre),
      }));
  }

  private async getQuartEvenementFiles(
    years: number[],
    months: number[],
    sites: Site[]
  ): Promise<FileInfo[]> {
    const siteIds = sites.map(s => s.id);
    const siteMap = new Map(sites.map(s => [s.id, s.localisation]));

    const query = this.quartEvenementRepository
      .createQueryBuilder("qe")
      .where("qe.url IS NOT NULL")
      .andWhere("qe.url != ''")
      .andWhere("qe.idUsine IN (:...siteIds)", { siteIds })
      .andWhere(
        new Brackets(qb => {
          for (const year of years) {
            for (const month of months) {
              qb.orWhere(
                `(YEAR(qe.date_heure_debut) = :year${year}${month} AND MONTH(qe.date_heure_debut) = :month${year}${month})`,
                {
                  [`year${year}${month}`]: year,
                  [`month${year}${month}`]: month,
                }
              );
            }
          }
        })
      );

    const evenements = await query.getMany();

    return evenements
      .filter(e => e.url)
      .map(e => ({
        filePath: e.url!,
        siteName: siteMap.get(e.idUsine) || `Site_${e.idUsine}`,
        siteId: e.idUsine,
        fileName: this.extractFileName(e.url!, e.titre),
      }));
  }

  private async getModeOperatoireFiles(sites: Site[]): Promise<FileInfo[]> {
    const siteIds = sites.map(s => s.id);
    const siteMap = new Map(sites.map(s => [s.id, s.localisation]));

    // Récupérer les zones des sites concernés
    const zones = await this.zoneControleRepository
      .createQueryBuilder("z")
      .where("z.idUsine IN (:...siteIds)", { siteIds })
      .getMany();

    if (zones.length === 0) {
      return [];
    }

    const zoneIds = zones.map(z => z.id);
    const zoneToSite = new Map(zones.map(z => [z.id, z.idUsine]));

    const modeOperatoires = await this.modeOperatoireRepository
      .createQueryBuilder("mo")
      .where("mo.fichier IS NOT NULL")
      .andWhere("mo.fichier != ''")
      .andWhere("mo.zoneId IN (:...zoneIds)", { zoneIds })
      .getMany();

    return modeOperatoires
      .filter(mo => mo.fichier && mo.zoneId)
      .map(mo => {
        const siteId = zoneToSite.get(mo.zoneId!) || 0;
        return {
          filePath: mo.fichier,
          siteName: siteMap.get(siteId) || `Site_${siteId}`,
          siteId,
          fileName: this.extractFileName(
            mo.fichier,
            mo.nom || "mode-operatoire"
          ),
        };
      });
  }

  private resolveFilePath(filePath: string, category: FileCategory): string {
    let cleanPath = filePath;

    // Nettoyer les préfixes URL courants
    const urlPrefixes = [
      "/api/uploads/",
      "api/uploads/",
      "/uploads/",
      "uploads/",
    ];
    for (const prefix of urlPrefixes) {
      if (cleanPath.startsWith(prefix)) {
        cleanPath = cleanPath.substring(prefix.length);
        break;
      }
    }

    // Si le chemin est déjà absolu
    if (cleanPath.startsWith(this.uploadsRoot)) {
      return cleanPath;
    }

    // Si le chemin commence par une catégorie connue
    if (
      cleanPath.startsWith("consignes/") ||
      cleanPath.startsWith("quart-evenements/") ||
      cleanPath.startsWith("mode-operatoire/")
    ) {
      return resolve(this.uploadsRoot, cleanPath);
    }

    // Sinon, ajouter le préfixe de catégorie
    const categoryFolder =
      category === FileCategory.QUART_EVENEMENTS
        ? "quart-evenements"
        : category;
    return resolve(this.uploadsRoot, categoryFolder, cleanPath);
  }

  private extractFileName(filePath: string, title: string): string {
    // Essayer d'extraire le nom de fichier du chemin
    const baseName = basename(filePath);
    if (baseName && baseName !== filePath) {
      return baseName;
    }
    // Sinon utiliser le titre avec extension
    const ext = filePath.split(".").pop() || "pdf";
    return `${this.sanitizeFilename(title)}.${ext}`;
  }

  private sanitizeFilename(name: string): string {
    return name
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, "_")
      .substring(0, 100);
  }

  private groupFilesBySite(files: FileInfo[]): Map<string, FileInfo[]> {
    const map = new Map<string, FileInfo[]>();
    for (const file of files) {
      const siteName = this.sanitizeFilename(file.siteName);
      const existing = map.get(siteName) || [];
      existing.push(file);
      map.set(siteName, existing);
    }
    return map;
  }
}
