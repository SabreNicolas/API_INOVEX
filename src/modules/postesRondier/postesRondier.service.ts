import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Not, Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import { PosteRondier } from "../../entities";
import { CreatePosteRondierDto, UpdatePosteRondierDto } from "./dto";

@Injectable()
export class PostesRondierService {
  constructor(
    @InjectRepository(PosteRondier)
    private readonly postesRondierRepository: Repository<PosteRondier>,
    private readonly logger: LoggerService
  ) {}

  async findAll(): Promise<
    Record<string, unknown>[] | Record<string, unknown>
  > {
    try {
      // Si pas de pagination, retourner tous les résultats (rétrocompatibilité) avec limite de sécurité
      const postes = await this.postesRondierRepository.find({
        order: { id: "ASC" },
      });
      return postes.map(poste => ({
        id: poste.id,
        nom: poste.nom,
      }));
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des postes rondier",
        error instanceof Error ? error.stack : String(error),
        "PostesRondierService"
      );
      throw error;
    }
  }

  async create(
    createPosteRondierDto: CreatePosteRondierDto
  ): Promise<{ id: number }> {
    const { nom } = createPosteRondierDto;

    try {
      // Vérifier si le nom existe déjà
      const existing = await this.postesRondierRepository.findOne({
        where: { nom },
        select: ["id"],
      });

      if (existing) {
        throw new BadRequestException("Ce nom est déjà utilisé");
      }

      // Utiliser l'idUsine du DTO si fourni, sinon celui de l'utilisateur courant, sinon 1

      const user = this.postesRondierRepository.create({
        nom,
      });

      const savedUser = await this.postesRondierRepository.save(user);

      this.logger.log(`Poste rondier créé: ${nom}`, "PostesRondierService");

      return { id: savedUser.id };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la création du poste rondier",
        error instanceof Error ? error.stack : String(error),
        "PostesRondierService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    updatePosteRondierDto: UpdatePosteRondierDto
  ): Promise<void> {
    try {
      // Vérifier que l'utilisateur existe (et appartient au même site si idUsine spécifié)
      const whereCondition: { id: number } = { id: id };

      const existing = await this.postesRondierRepository.findOne({
        where: whereCondition,
        select: ["id", "nom"],
      });

      if (!existing) {
        throw new NotFoundException(`Poste rondier avec l'ID ${id} non trouvé`);
      }

      // Si le nom change, vérifier qu'il n'est pas déjà utilisé
      if (
        updatePosteRondierDto.nom &&
        updatePosteRondierDto.nom !== existing.nom
      ) {
        const nomCheck = await this.postesRondierRepository.findOne({
          where: { nom: updatePosteRondierDto.nom, id: Not(id) },
          select: ["id"],
        });

        if (nomCheck) {
          throw new BadRequestException("Ce nom est déjà utilisé");
        }
      }

      // Construire l'objet de mise à jour
      const updateData: Partial<PosteRondier> = {};

      if (updatePosteRondierDto.nom) updateData.nom = updatePosteRondierDto.nom;

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException("Aucune donnée à mettre à jour");
      }

      await this.postesRondierRepository.update({ id: id }, updateData);

      this.logger.log(`Poste rondier ${id} mis à jour`, "PostesRondierService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour du poste rondier",
        error instanceof Error ? error.stack : String(error),
        "PostesRondierService"
      );
      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    try {
      const whereCondition: { id: number } = { id: id };

      const existing = await this.postesRondierRepository.findOne({
        where: whereCondition,
        select: ["id"],
      });

      if (!existing) {
        throw new NotFoundException(`Poste rondier avec l'ID ${id} non trouvé`);
      }

      // Suppression du poste rondier
      await this.postesRondierRepository.delete({ id: id });

      this.logger.log(`Poste rondier ${id} supprimé`, "PostesRondierService");
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression du poste rondier",
        error instanceof Error ? error.stack : String(error),
        "PostesRondierService"
      );
      throw error;
    }
  }
}
