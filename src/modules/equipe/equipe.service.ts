import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { AffectationEquipe, Equipe } from "../../entities";
import { CreateEquipeDto, UpdateEquipeDto } from "./dto";

@Injectable()
export class EquipeService {
  constructor(
    @InjectRepository(Equipe)
    private readonly equipeRepository: Repository<Equipe>,
    @InjectRepository(AffectationEquipe)
    private readonly affectationEquipeRepository: Repository<AffectationEquipe>,
    private readonly logger: LoggerService
  ) {}

  async findAll(idUsine: number): Promise<Record<string, unknown>[]> {
    try {
      const affectations = await this.affectationEquipeRepository.find({
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
        "EquipeService"
      );
      throw error;
    }
  }

  async findOne(id: number): Promise<Record<string, unknown>> {
    try {
      const equipe = await this.equipeRepository.findOne({
        where: { id },
        relations: ["chefQuart"],
      });

      if (!equipe) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      const affectations = await this.affectationEquipeRepository.find({
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
        "EquipeService"
      );
      throw error;
    }
  }

  async findByDateAndQuart(
    idUsine: number,
    date: string,
    quart: number
  ): Promise<Record<string, unknown> | null> {
    try {
      const equipe = await this.equipeRepository
        .createQueryBuilder("e")
        .innerJoin("users", "chef", "chef.Id = e.idChefQuart")
        .where("e.date = :date", { date })
        .andWhere("e.quart = :quart", { quart })
        .getOne();
      console.log("Équipe trouvée:", equipe);
      console.log("Date recherchée:", date, "Quart recherché:", quart);
      if (!equipe) {
        return null;
      }

      const affectations = await this.affectationEquipeRepository.find({
        where: { idEquipe: equipe.id },
        relations: ["rondier"],
        order: { id: "ASC" },
      });

      return { ...equipe, affectations };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EquipeService"
      );
      throw error;
    }
  }

  async create(createDto: CreateEquipeDto): Promise<{ id: number }> {
    try {
      const equipe = this.equipeRepository.create({
        equipe: createDto.equipe,
        quart: createDto.quart,
        idChefQuart: createDto.idChefQuart,
        date: createDto.date || null,
      });
      const savedEquipe = await this.equipeRepository.save(equipe);

      if (createDto.affectations?.length) {
        const affectations = createDto.affectations.map(aff =>
          this.affectationEquipeRepository.create({
            idEquipe: savedEquipe.id,
            idRondier: aff.idRondier,
            idZone: aff.idZone,
            poste: aff.poste || "",
            heure_deb: aff.heure_deb || "",
            heure_fin: aff.heure_fin || "",
            heure_tp: aff.heure_tp || "00:00",
            comm_tp: aff.comm_tp || "",
          })
        );
        await this.affectationEquipeRepository.save(affectations);
      }

      this.logger.log(
        `Équipe créée: ${savedEquipe.equipe} (ID: ${savedEquipe.id})`,
        "EquipeService"
      );

      return { id: savedEquipe.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EquipeService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateEquipeDto,
    idUsine: number
  ): Promise<void> {
    try {
      const existing = await this.equipeRepository.findOne({
        where: { id },
      });

      if (!existing) {
        throw new NotFoundException(`Équipe avec l'ID ${id} non trouvée`);
      }

      // Mettre à jour le nom si fourni
      if (updateDto.equipe && updateDto.equipe !== existing.equipe) {
        const nameCheck = await this.equipeRepository
          .createQueryBuilder("equipe")
          .innerJoin(
            "affectation_equipe",
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
      }

      // Mettre à jour les champs de l'équipe
      const updateData: Partial<Equipe> = {};
      if (updateDto.equipe !== undefined) updateData.equipe = updateDto.equipe;
      if (updateDto.quart !== undefined) updateData.quart = updateDto.quart;
      if (updateDto.idChefQuart !== undefined)
        updateData.idChefQuart = updateDto.idChefQuart;
      if (updateDto.date !== undefined) updateData.date = updateDto.date;

      if (Object.keys(updateData).length > 0) {
        await this.equipeRepository.update({ id }, updateData);
      }

      // Mettre à jour les affectations si fournies
      if (updateDto.affectations !== undefined) {
        const existingAffectations =
          await this.affectationEquipeRepository.find({
            where: { idEquipe: id },
          });

        const sentIds = updateDto.affectations
          .filter(a => a.id !== undefined)
          .map(a => a.id as number);

        // Supprimer les affectations absentes de la liste
        const toDelete = existingAffectations.filter(
          a => !sentIds.includes(a.id)
        );
        if (toDelete.length > 0) {
          await this.affectationEquipeRepository.delete(
            toDelete.map(a => a.id)
          );
        }

        // Mettre à jour ou créer les affectations
        for (const aff of updateDto.affectations) {
          if (aff.id) {
            // Mise à jour
            const updateAffData: Partial<AffectationEquipe> = {};
            if (aff.idRondier !== undefined)
              updateAffData.idRondier = aff.idRondier;
            if (aff.idZone !== undefined) updateAffData.idZone = aff.idZone;
            if (aff.poste !== undefined) updateAffData.poste = aff.poste;
            if (aff.heure_deb !== undefined)
              updateAffData.heure_deb = aff.heure_deb;
            if (aff.heure_fin !== undefined)
              updateAffData.heure_fin = aff.heure_fin;
            if (aff.heure_tp !== undefined)
              updateAffData.heure_tp = aff.heure_tp;
            if (aff.comm_tp !== undefined) updateAffData.comm_tp = aff.comm_tp;

            if (Object.keys(updateAffData).length > 0) {
              await this.affectationEquipeRepository.update(
                { id: aff.id, idEquipe: id },
                updateAffData
              );
            }
          } else {
            // Création
            const newAff = this.affectationEquipeRepository.create({
              idEquipe: id,
              idRondier: aff.idRondier!,
              idZone: aff.idZone!,
              poste: aff.poste || "",
              heure_deb: aff.heure_deb || "",
              heure_fin: aff.heure_fin || "",
              heure_tp: aff.heure_tp || "00:00",
              comm_tp: aff.comm_tp || "",
            });
            await this.affectationEquipeRepository.save(newAff);
          }
        }
      }

      this.logger.log(`Équipe ${id} mise à jour`, "EquipeService");
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
        "EquipeService"
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

      // Supprimer d'abord les affectations
      await this.affectationEquipeRepository.delete({ idEquipe: id });

      // Puis supprimer l'équipe
      await this.equipeRepository.delete({ id });

      this.logger.log(
        `Équipe ${id} et ses affectations supprimées`,
        "EquipeService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'équipe",
        error instanceof Error ? error.stack : String(error),
        "EquipeService"
      );
      throw error;
    }
  }
}
