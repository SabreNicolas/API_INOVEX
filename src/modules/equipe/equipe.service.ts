import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { AffectationEquipe, Equipe } from "../../entities";

@Injectable()
export class EquipeService {
  constructor(
    @InjectRepository(Equipe)
    private readonly equipeRepository: Repository<Equipe>,
    @InjectRepository(AffectationEquipe)
    private readonly affectationEquipeRepository: Repository<AffectationEquipe>,
    private readonly logger: LoggerService
  ) {}

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
        .andWhere("chef.idUsine = :idUsine", { idUsine })
        .getOne();

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
}
