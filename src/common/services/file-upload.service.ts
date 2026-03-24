import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "fs";
import { join } from "path";
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
    if (!existsSync(subDir)) {
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
    this.validateFile(file);

    const usineFolderName = await this.getUsineFolderName(idUsine);
    const refDate = date || new Date();
    const annee = refDate.getFullYear().toString();
    const mois = (refDate.getMonth() + 1).toString().padStart(2, "0");
    const extension = file.originalname.split(".").pop() || "";
    const filename = `${uuidv4()}.${extension}`;
    const dirPath = join(
      this.uploadPath,
      "consignes",
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
        url: `/uploads/consignes/${usineFolderName}/${annee}/${mois}/${filename}`,
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

  async saveQuartEvenementFile(
    file: Express.Multer.File,
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
      "quart-evenements",
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
        url: `/uploads/quart-evenements/${usineFolderName}/${annee}/${mois}/${filename}`,
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

  deleteFile(url: string): void {
    if (!url || !url.startsWith("/uploads/consignes/")) {
      return;
    }

    const filename = url.replace("/uploads/consignes/", "");
    const filePath = join(this.uploadPath, "consignes", filename);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (existsSync(filePath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        unlinkSync(filePath);
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

  async saveModeOperatoireFile(
    file: Express.Multer.File,
    idUsine: number
  ): Promise<UploadedFileInfo> {
    this.validateFile(file);

    const usineFolderName = await this.getUsineFolderName(idUsine);
    const now = new Date();
    const annee = now.getFullYear().toString();
    const mois = (now.getMonth() + 1).toString().padStart(2, "0");
    const extension = file.originalname.split(".").pop() || "";
    const filename = `${uuidv4()}.${extension}`;
    const dirPath = join(
      this.uploadPath,
      "mode-operatoire",
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
        `Fichier mode opératoire uploadé: ${filename} (original: ${file.originalname})`,
        "FileUploadService"
      );

      return {
        filename,
        originalname: file.originalname,
        path: filePath,
        url: `/uploads/mode-operatoire/${usineFolderName}/${annee}/${mois}/${filename}`,
      };
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'upload du fichier mode opératoire: ${file.originalname}`,
        error instanceof Error ? error.stack : String(error),
        "FileUploadService"
      );
      throw new BadRequestException(
        "Erreur lors de l'enregistrement du fichier"
      );
    }
  }

  deleteModeOperatoireFile(url: string): void {
    if (!url || !url.startsWith("/uploads/mode-operatoire/")) {
      return;
    }

    const filename = url.replace("/uploads/mode-operatoire/", "");
    const filePath = join(this.uploadPath, "mode-operatoire", filename);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      if (existsSync(filePath)) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        unlinkSync(filePath);
        this.logger.log(
          `Fichier mode opératoire supprimé: ${filename}`,
          "FileUploadService"
        );
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors de la suppression du fichier mode opératoire: ${filename}`,
        error instanceof Error ? error.stack : String(error),
        "FileUploadService"
      );
    }
  }
}
