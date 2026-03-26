import { ConflictException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ValidationDonnee } from "../../entities";
import { CreateValidationDonneeDto } from "./dto";

@Injectable()
export class ValidationDonneesService {
  constructor(
    @InjectRepository(ValidationDonnee)
    private readonly validationDonneeRepository: Repository<ValidationDonnee>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Récupère les validations de données par année et mois
   */
  async findByAnneeAndMois(
    idUsine: number,
    annee: string,
    mois: string
  ): Promise<ValidationDonnee[]> {
    try {
      return await this.validationDonneeRepository.find({
        where: {
          idUsine,
          anneeValidation: annee,
          moisValidation: mois,
        },
        order: { date: "DESC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des validations de données",
        error instanceof Error ? error.stack : String(error),
        "ValidationDonneesService"
      );
      throw error;
    }
  }

  /**
   * Crée une nouvelle validation de données
   */
  async create(
    createDto: CreateValidationDonneeDto,
    idUsine: number,
    idUser: number
  ): Promise<ValidationDonnee> {
    try {
      // Vérifier si une validation existe déjà pour ce mois/année/usine
      const existingValidation = await this.validationDonneeRepository.findOne({
        where: {
          idUsine,
          moisValidation: createDto.moisValidation,
          anneeValidation: createDto.anneeValidation,
        },
      });

      if (existingValidation) {
        throw new ConflictException(
          `Une validation existe déjà pour ${createDto.moisValidation}/${createDto.anneeValidation}`
        );
      }

      const validation = this.validationDonneeRepository.create({
        idUser,
        idUsine,
        date: new Date().toISOString().split("T")[0],
        moisValidation: createDto.moisValidation,
        anneeValidation: createDto.anneeValidation,
      });

      const savedValidation =
        await this.validationDonneeRepository.save(validation);

      this.logger.log(
        `Validation créée pour ${createDto.moisValidation}/${createDto.anneeValidation} - Usine ${idUsine}`,
        "ValidationDonneesService"
      );

      return savedValidation;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création de la validation",
        error instanceof Error ? error.stack : String(error),
        "ValidationDonneesService"
      );
      throw error;
    }
  }
}
