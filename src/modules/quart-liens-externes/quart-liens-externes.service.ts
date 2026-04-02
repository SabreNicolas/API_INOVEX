import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { QuartLienExterne } from "../../entities";
import { CreateQuartLienExterneDto, UpdateQuartLienExterneDto } from "./dto";

@Injectable()
export class QuartLiensExternesService {
  constructor(
    @InjectRepository(QuartLienExterne)
    private readonly quartLienExterneRepository: Repository<QuartLienExterne>,
    private readonly logger: LoggerService
  ) {}

  async findAll(idUsine: number): Promise<QuartLienExterne[]> {
    try {
      return this.quartLienExterneRepository.find({
        where: { idUsine },
        order: { nom: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des liens externes",
        error instanceof Error ? error.stack : String(error),
        "QuartLiensExternesService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartLienExterne> {
    try {
      const lienExterne = await this.quartLienExterneRepository.findOne({
        where: { id, idUsine },
      });

      if (!lienExterne) {
        throw new NotFoundException(`Lien externe avec l'ID ${id} non trouvé`);
      }

      return lienExterne;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération du lien externe",
        error instanceof Error ? error.stack : String(error),
        "QuartLiensExternesService"
      );
      throw error;
    }
  }

  async create(
    idUsine: number,
    createDto: CreateQuartLienExterneDto
  ): Promise<{ id: number }> {
    try {
      const lienExterne = this.quartLienExterneRepository.create({
        nom: createDto.nom,
        url: createDto.url,
        idUsine,
        actif: createDto.actif ?? true,
      });

      const saved = await this.quartLienExterneRepository.save(lienExterne);

      this.logger.log(
        `Lien externe créé: ${saved.nom} (ID: ${saved.id})`,
        "QuartLiensExternesService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création du lien externe",
        error instanceof Error ? error.stack : String(error),
        "QuartLiensExternesService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartLienExterneDto
  ): Promise<void> {
    try {
      const existing = await this.quartLienExterneRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Lien externe avec l'ID ${id} non trouvé`);
      }

      const updateData: Partial<QuartLienExterne> = {};

      if (updateDto.nom !== undefined) updateData.nom = updateDto.nom;
      if (updateDto.url !== undefined) updateData.url = updateDto.url;
      if (updateDto.actif !== undefined) updateData.actif = updateDto.actif;

      if (Object.keys(updateData).length > 0) {
        await this.quartLienExterneRepository.update(id, updateData);
      }

      this.logger.log(
        `Lien externe mis à jour: ID ${id}`,
        "QuartLiensExternesService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du lien externe",
        error instanceof Error ? error.stack : String(error),
        "QuartLiensExternesService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartLienExterneRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(`Lien externe avec l'ID ${id} non trouvé`);
      }

      await this.quartLienExterneRepository.delete(id);

      this.logger.log(
        `Lien externe supprimé: ID ${id}`,
        "QuartLiensExternesService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du lien externe",
        error instanceof Error ? error.stack : String(error),
        "QuartLiensExternesService"
      );
      throw error;
    }
  }
}
