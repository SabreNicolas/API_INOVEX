import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  EnregistrementAffectationEquipe,
  EnregistrementEquipe,
} from "../../entities";
import { CreateEnregistrementEquipeDto } from "./dto/create-enregistrement-equipe.dto";
import { UpdateEnregistrementEquipeDto } from "./dto/update-enregistrement-equipe.dto";

@Injectable()
export class EnregistrementEquipeService {
  constructor(
    @InjectRepository(EnregistrementEquipe)
    private readonly equipeRepository: Repository<EnregistrementEquipe>,
    @InjectRepository(EnregistrementAffectationEquipe)
    private readonly affectationRepository: Repository<EnregistrementAffectationEquipe>,
    private readonly logger: LoggerService
  ) {}

  async findAll(idUsine: number): Promise<Record<string, unknown>[]> {
    try {
      const affectations = await this.affectationRepository.find({
        where: { rondier: { idUsine } },
        relations: ["rondier"],
        order: { idEquipe: "ASC", id: "ASC" },
      });

      const equipeIds = [...new Set(affectations.map(a => a.idEquipe))];

      if (equipeIds.length === 0) {
        return [];
      }

      const equipes = await this.equipeRepository.findByIds(equipeIds);
      const equipeMap = new Map(equipes.map(e => [e.id, e]));

      return equipeIds
        .map(eqId => {
          const equipe = equipeMap.get(eqId);
          if (!equipe) return null;
          return {
            ...equipe,
            affectations: affectations.filter(a => a.idEquipe === eqId),
          };
        })
        .filter(Boolean) as Record<string, unknown>[];
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des équipes",
        error instanceof Error ? error.stack : String(error),
        "EnregistrementEquipeService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Record<string, unknown>> {
    try {
      const equipe = await this.equipeRepository.findOne({
        where: { id },
      });

      if (!equipe) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      const affectations = await this.affectationRepository.find({
        where: { idEquipe: id },
        relations: ["rondier"],
        order: { id: "ASC" },
      });

      return { ...equipe, affectations };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EnregistrementEquipeService"
      );
      throw error;
    }
  }

  async create(
    createDto: CreateEnregistrementEquipeDto,
    idUsine: number
  ): Promise<{ id: number }> {
    try {
      const existing = await this.equipeRepository
        .createQueryBuilder("equipe")
        .innerJoin(
          "enregistrement_affectation_equipe",
          "affectation",
          "affectation.idEquipe = equipe.id"
        )
        .innerJoin("users", "rondier", "rondier.Id = affectation.idRondier")
        .where("equipe.equipe = :nom", { nom: createDto.equipe })
        .andWhere("rondier.idUsine = :idUsine", { idUsine })
        .getOne();

      if (existing) {
        throw new BadRequestException("Ce nom d'équipe est déjà utilisé");
      }

      const equipe = this.equipeRepository.create({
        equipe: createDto.equipe,
      });
      const savedEquipe = await this.equipeRepository.save(equipe);

      if (createDto.affectations?.length) {
        const affectations = createDto.affectations.map(aff =>
          this.affectationRepository.create({
            idEquipe: savedEquipe.id,
            idRondier: aff.idRondier,
            poste: aff.poste || "",
          })
        );
        await this.affectationRepository.save(affectations);
      }

      this.logger.log(
        `Équipe créée: ${savedEquipe.equipe} (ID: ${savedEquipe.id})`,
        "EnregistrementEquipeService"
      );

      return { id: savedEquipe.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EnregistrementEquipeService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateEnregistrementEquipeDto,
    idUsine: number
  ): Promise<void> {
    try {
      const existing = await this.equipeRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      // Update equipe name if provided
      if (updateDto.equipe && updateDto.equipe !== existing.equipe) {
        const nameCheck = await this.equipeRepository
          .createQueryBuilder("equipe")
          .innerJoin(
            "enregistrement_affectation_equipe",
            "affectation",
            "affectation.idEquipe = equipe.id"
          )
          .innerJoin("users", "rondier", "rondier.Id = affectation.idRondier")
          .where("equipe.equipe = :nom", { nom: updateDto.equipe })
          .andWhere("equipe.id != :id", { id })
          .andWhere("rondier.idUsine = :idUsine", { idUsine })
          .getOne();

        if (nameCheck) {
          throw new BadRequestException("Ce nom d'équipe est déjà utilisé");
        }

        await this.equipeRepository.update(
          { id },
          { equipe: updateDto.equipe }
        );
      }

      // Update affectations if provided
      if (updateDto.affectations !== undefined) {
        const existingAffectations = await this.affectationRepository.find({
          where: { idEquipe: id },
        });

        const sentIds = updateDto.affectations
          .filter(a => a.id !== undefined)
          .map(a => a.id as number);

        // Delete affectations not in the sent list
        const toDelete = existingAffectations.filter(
          a => !sentIds.includes(a.id)
        );
        if (toDelete.length > 0) {
          await this.affectationRepository.delete(toDelete.map(a => a.id));
        }

        // Update or create affectations
        for (const aff of updateDto.affectations) {
          if (aff.id) {
            // Update existing
            const updateData: Partial<EnregistrementAffectationEquipe> = {};
            if (aff.idRondier !== undefined)
              updateData.idRondier = aff.idRondier;
            if (aff.poste !== undefined) updateData.poste = aff.poste;

            if (Object.keys(updateData).length > 0) {
              await this.affectationRepository.update(
                { id: aff.id, idEquipe: id },
                updateData
              );
            }
          } else {
            // Create new
            const newAff = this.affectationRepository.create({
              idEquipe: id,
              idRondier: aff.idRondier!,
              poste: aff.poste || "",
            });
            await this.affectationRepository.save(newAff);
          }
        }
      }

      this.logger.log(
        `Équipe ${id} mise à jour`,
        "EnregistrementEquipeService"
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EnregistrementEquipeService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const existing = await this.equipeRepository.findOne({
        where: { id },
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      // Delete all affectations first
      await this.affectationRepository.delete({ idEquipe: id });

      // Then delete the equipe
      await this.equipeRepository.delete({ id });

      this.logger.log(
        `Équipe ${id} et ses affectations supprimées`,
        "EnregistrementEquipeService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EnregistrementEquipeService"
      );
      throw error;
    }
  }
}
