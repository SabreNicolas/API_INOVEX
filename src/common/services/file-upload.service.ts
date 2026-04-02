import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";

import { Site } from "../../entities";
import { LoggerService } from "./logger.service";

export interface UploadedFileInfo {
  filename: string;
  originalname: string;
  path: string;
  url: string;
}

@Injectable()
export class FileUploadService {
  private readonly uploadPath = join(process.cwd(), "uploads");
  private readonly allowedMimeTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    private readonly logger: LoggerService
  ) {
    this.ensureUploadDirExists();
  }

  private async getUsineFolderName(idUsine: number): Promise<string> {
    const site = await this.siteRepository.findOne({ where: { id: idUsine } });
    if (!site) {
      throw new BadRequestException(`Usine avec l'ID ${idUsine} non trouvée`);
    }
    return site.localisation;
  }

  private ensureSubDirExists(subDir: string): void {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!existsSync(subDir)) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      mkdirSync(subDir, { recursive: true });
      this.logger.log(`Dossier d'upload créé: ${subDir}`, "FileUploadService");
    }
  }

  private ensureUploadDirExists(): void {
    const consignesDir = join(this.uploadPath, "consignes");
    const modeOperatoireDir = join(this.uploadPath, "mode-operatoire");
    const quartEvenementsDir = join(this.uploadPath, "quart-evenements");
    for (const dir of [consignesDir, modeOperatoireDir, quartEvenementsDir]) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (!existsSync(dir)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        mkdirSync(dir, { recursive: true });
        this.logger.log(`Dossier d'upload créé: ${dir}`, "FileUploadService");
      }
    }
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException("Aucun fichier fourni");
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Type de fichier non autorisé: ${file.mimetype}. Types autorisés: PDF, images (JPEG, PNG, GIF), Word, Excel`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Fichier trop volumineux. Taille maximale: ${this.maxFileSize / 1024 / 1024}MB`
      );
    }
  }

  async saveConsigneFile(
    file: Express.Multer.File,
    idUsine: number,
    date?: Date
  ): Promise<UploadedFileInfo> {
    return this.saveFile(file, "consignes", idUsine, date);
  }

  async saveQuartEvenementFile(
    file: Express.Multer.File,
    idUsine: number,
    date?: Date
  ): Promise<UploadedFileInfo> {
    return this.saveFile(file, "quart-evenements", idUsine, date);
  }

  async saveModeOperatoireFile(
    file: Express.Multer.File,
    idUsine: number
  ): Promise<UploadedFileInfo> {
    return this.saveFile(file, "mode-operatoire", idUsine);
  }

  deleteFile(url: string): void {
    this.deleteFileFromFolder(url, "/uploads/consignes/", "consignes");
  }

  deleteModeOperatoireFile(url: string): void {
    this.deleteFileFromFolder(
      url,
      "/uploads/mode-operatoire/",
      "mode-operatoire"
    );
  }

  private async saveFile(
    file: Express.Multer.File,
    subFolder: string,
    idUsine: number,
    date?: Date
  ): Promise<UploadedFileInfo> {
    this.validateFile(file);

    const usineFolderName = await this.getUsineFolderName(idUsine);
    const refDate = date || new Date();
    const annee = refDate.getFullYear().toString();
    const mois = (refDate.getMonth() + 1).toString().padStart(2, "0");
    const extension = file.originalname.split(".").pop() || "";
    const filename = `${uuidv4()}.${extension}`;
    const dirPath = join(
      this.uploadPath,
      subFolder,
      usineFolderName,
      annee,
      mois
    );
    this.ensureSubDirExists(dirPath);
    const filePath = join(dirPath, filename);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      writeFileSync(filePath, file.buffer);

      this.logger.log(
        `Fichier uploadé: ${filename} (original: ${file.originalname})`,
        "FileUploadService"
      );

      return {
        filename,
        originalname: file.originalname,
        path: filePath,
        url: `/uploads/${subFolder}/${usineFolderName}/${annee}/${mois}/${filename}`,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'upload du fichier: ${file.originalname}`,
        error instanceof Error ? error.stack : String(error),
        "FileUploadService"
      );
      throw new BadRequestException(
        "Erreur lors de l'enregistrement du fichier"
      );
    }
  }

  private deleteFileFromFolder(
    url: string,
    expectedPrefix: string,
    subFolder: string
  ): void {
    if (!url || !url.startsWith(expectedPrefix)) {
      return;
    }

    const filename = url.replace(expectedPrefix, "");
    const filePath = join(this.uploadPath, subFolder, filename);
    const resolvedPath = resolve(filePath);
    const allowedRoot = resolve(this.uploadPath, subFolder);

    if (!resolvedPath.startsWith(allowedRoot)) {
      this.logger.warn(
        `Tentative de path traversal détectée: ${url}`,
        "FileUploadService"
      );
      return;
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (existsSync(resolvedPath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        unlinkSync(resolvedPath);
        this.logger.log(`Fichier supprimé: ${filename}`, "FileUploadService");
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du fichier: ${filename}`,
        error instanceof Error ? error.stack : String(error),
        "FileUploadService"
      );
    }
  }
}
