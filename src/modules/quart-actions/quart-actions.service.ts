import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { ActionEnregistrement, QuartAction } from "../../entities";
import { CreateQuartActionDto, UpdateQuartActionDto } from "./dto";

@Injectable()
export class QuartActionsService {
  constructor(
    @InjectRepository(QuartAction)
    private readonly quartActionRepository: Repository<QuartAction>,
    @InjectRepository(ActionEnregistrement)
    private readonly actionEnregistrementRepository: Repository<ActionEnregistrement>,
    private readonly logger: LoggerService
  ) {}

  async findAllEnregistrements(
    idUsine: number
  ): Promise<ActionEnregistrement[]> {
    try {
      return this.actionEnregistrementRepository.find({
        where: { idUsine },
        order: { nom: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions enregistrement",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findAll(idUsine: number): Promise<QuartAction[]> {
    try {
      return this.quartActionRepository.find({
        where: { idUsine },
        order: { date_heure_debut: "DESC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartAction> {
    try {
      const action = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!action) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      return action;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async create(
    idUsine: number,
    createDto: CreateQuartActionDto
  ): Promise<{ id: number }> {
    try {
      const action = this.quartActionRepository.create({
        nom: createDto.nom,
        idUsine,
        date_heure_debut: new Date(createDto.date_heure_debut),
        date_heure_fin: new Date(createDto.date_heure_fin),
      });

      const saved = await this.quartActionRepository.save(action);

      this.logger.log(
        `Action créée: ${saved.nom} (ID: ${saved.id})`,
        "QuartActionsService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartActionDto
  ): Promise<void> {
    try {
      const existing = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      const updateData: Partial<QuartAction> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);

      if (Object.keys(updateData).length > 0) {
        await this.quartActionRepository.update(id, updateData);
      }

      this.logger.log(`Action mise à jour: ID ${id}`, "QuartActionsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartActionRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Action avec l'ID ${id} non trouvée`);
      }

      await this.quartActionRepository.delete(id);

      this.logger.log(`Action supprimée: ID ${id}`, "QuartActionsService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'action",
        error instanceof Error ? error.stack : String(error),
        "QuartActionsService"
      );
      throw error;
    }
  }
}
