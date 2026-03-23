import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  ActionEnregistrement,
  QuartAction,
  QuartCalendrier,
  ZoneControle,
} from "../../entities";
import { CreateQuartCalendrierDto, UpdateQuartCalendrierDto } from "./dto";

@Injectable()
export class QuartCalendrierService {
  constructor(
    @InjectRepository(QuartCalendrier)
    private readonly quartCalendrierRepository: Repository<QuartCalendrier>,
    @InjectRepository(QuartAction)
    private readonly quartActionRepository: Repository<QuartAction>,
    @InjectRepository(ActionEnregistrement)
    private readonly actionEnregistrementRepository: Repository<ActionEnregistrement>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    private readonly logger: LoggerService
  ) {}

  async findHorairesByDateAndQuart(
    idUsine: number,
    date: string,
    quart: number
  ): Promise<{
    date_heure_debut: Date | null;
    date_heure_fin: Date | null;
  }> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const row = await this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .select("MIN(qc.date_heure_debut)", "date_heure_debut")
        .addSelect("MAX(qc.date_heure_fin)", "date_heure_fin")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.quart = :quart", { quart })
        .andWhere("qc.date_heure_debut >= :startOfDay", { startOfDay })
        .andWhere("qc.date_heure_debut <= :endOfDay", { endOfDay })
        .getRawOne();

      return {
        date_heure_debut: row?.date_heure_debut
          ? new Date(row.date_heure_debut)
          : null,
        date_heure_fin: row?.date_heure_fin
          ? new Date(row.date_heure_fin)
          : null,
      };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des horaires de quart",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async findByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date
  ): Promise<QuartCalendrier[]> {
    try {
      return this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .leftJoinAndSelect("qc.action", "action")
        .leftJoinAndSelect("qc.zone", "zone")
        .leftJoinAndSelect("qc.user", "user")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere(
          "(qc.date_heure_debut BETWEEN :startDate AND :endDate OR qc.date_heure_fin BETWEEN :startDate AND :endDate OR (qc.date_heure_debut <= :startDate AND (qc.date_heure_fin >= :endDate OR qc.date_heure_fin IS NULL)))",
          { startDate, endDate }
        )
        .orderBy("qc.date_heure_debut", "ASC")
        .getMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des entrées du calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async findZonesByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date
  ): Promise<QuartCalendrier[]> {
    try {
      return this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .leftJoinAndSelect("qc.zone", "zone")
        .leftJoinAndSelect("qc.user", "user")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.idZone IS NOT NULL")
        .andWhere(
          "(qc.date_heure_debut = :startDate AND qc.date_heure_fin = :endDate)",
          { startDate, endDate }
        )
        .orderBy("qc.date_heure_debut", "ASC")
        .getMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des zones du calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async findActionsByDateRange(
    idUsine: number,
    startDate: Date,
    endDate: Date
  ): Promise<QuartCalendrier[]> {
    try {
      return this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .leftJoinAndSelect("qc.action", "action")
        .leftJoinAndSelect("qc.user", "user")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.idAction IS NOT NULL")
        .andWhere(
          "(qc.date_heure_debut = :startDate AND qc.date_heure_fin = :endDate)",
          { startDate, endDate }
        )
        .orderBy("qc.date_heure_debut", "ASC")
        .getMany();
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des actions du calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async findOne(id: number, idUsine: number): Promise<QuartCalendrier> {
    try {
      const entry = await this.quartCalendrierRepository.findOne({
        where: { id, idUsine },
      });

      if (!entry) {
        throw new NotFoundException(
          `Entrée calendrier avec l'ID ${id} non trouvée`
        );
      }

      return entry;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de l'entrée calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  private async resolveActionId(
    dto: CreateQuartCalendrierDto,
    idUsine: number
  ): Promise<number | null> {
    if (dto.idZone) return null;

    // Cas 1 : un quart_action existant est passé directement
    if (dto.idQuartAction) {
      const existing = await this.quartActionRepository.findOne({
        where: { id: dto.idQuartAction },
      });
      console.log("Existing QuartAction:", existing);
      if (!existing) {
        throw new NotFoundException(
          `QuartAction avec l'ID ${dto.idQuartAction} non trouvée`
        );
      }
      return existing.id;
    }

    // Cas 2 : un ActionEnregistrement est passé → on crée un quart_action
    if (!dto.idAction) return null;

    const actionEnregistrement =
      await this.actionEnregistrementRepository.findOne({
        where: { id: dto.idAction },
      });

    if (!actionEnregistrement) {
      throw new NotFoundException(
        `ActionEnregistrement avec l'ID ${dto.idAction} non trouvée`
      );
    }

    const quartAction = this.quartActionRepository.create({
      nom: actionEnregistrement.nom,
      idUsine,
      date_heure_debut: new Date(dto.date_heure_debut),
      date_heure_fin: dto.date_heure_fin
        ? new Date(dto.date_heure_fin)
        : new Date(dto.date_heure_debut),
    });

    const savedAction = await this.quartActionRepository.save(quartAction);
    return savedAction.id;
  }

  async create(
    idUsine: number,
    createDto: CreateQuartCalendrierDto
  ): Promise<{ id: number }> {
    try {
      const resolvedActionId = await this.resolveActionId(createDto, idUsine);

      const entry = this.quartCalendrierRepository.create({
        idUsine,
        idZone: createDto.idZone ?? null,
        idAction: resolvedActionId,
        date_heure_debut: new Date(createDto.date_heure_debut),
        quart: createDto.quart,
        termine: createDto.termine ?? 0,
        date_heure_fin: createDto.date_heure_fin
          ? new Date(createDto.date_heure_fin)
          : null,
        idUser: createDto.idUser ?? null,
        finReccurrence: createDto.finReccurrence ?? null,
        recurrencePhrase: createDto.recurrencePhrase ?? null,
      });

      const saved = await this.quartCalendrierRepository.save(entry);

      this.logger.log(
        `Entrée calendrier créée (ID: ${saved.id})`,
        "QuartCalendrierService"
      );

      return { id: saved.id };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de l'entrée calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async createBatch(
    idUsine: number,
    createDtos: CreateQuartCalendrierDto[]
  ): Promise<{ ids: number[]; skipped: number }> {
    // SQL Server limite à 2100 paramètres par requête (~10 colonnes par entrée)
    const CHUNK_SIZE = 200;

    try {
      const ids: number[] = [];
      let skipped = 0;

      for (let i = 0; i < createDtos.length; i += CHUNK_SIZE) {
        const dtoChunk = createDtos.slice(i, i + CHUNK_SIZE);

        for (const dto of dtoChunk) {
          const resolvedActionId = await this.resolveActionId(dto, idUsine);
          const dateHeureDebut = new Date(dto.date_heure_debut);
          const dateHeureFin = dto.date_heure_fin
            ? new Date(dto.date_heure_fin)
            : null;

          // Vérifier si l'entrée existe déjà (contrainte UNIQUE)
          const existing = await this.quartCalendrierRepository.findOne({
            where: {
              idUsine,
              idZone: dto.idZone ?? IsNull(),
              idAction: resolvedActionId ?? IsNull(),
              date_heure_debut: dateHeureDebut,
              date_heure_fin: dateHeureFin ?? IsNull(),
              quart: dto.quart,
            },
          });

          if (existing) {
            skipped++;
            continue;
          }

          const entry = this.quartCalendrierRepository.create({
            idUsine,
            idZone: dto.idZone ?? null,
            idAction: resolvedActionId,
            date_heure_debut: dateHeureDebut,
            quart: dto.quart,
            termine: dto.termine ?? 0,
            date_heure_fin: dateHeureFin,
            idUser: dto.idUser ?? null,
            finReccurrence: dto.finReccurrence ?? null,
            recurrencePhrase: dto.recurrencePhrase ?? null,
          });

          const saved = await this.quartCalendrierRepository.save(entry);
          ids.push(saved.id);
        }
      }

      this.logger.log(
        `${ids.length} entrées calendrier créées en batch, ${skipped} doublons ignorés`,
        "QuartCalendrierService"
      );

      return { ids, skipped };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création batch des entrées calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async update(
    id: number,
    idUsine: number,
    updateDto: UpdateQuartCalendrierDto
  ): Promise<void> {
    try {
      const existing = await this.quartCalendrierRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Entrée calendrier avec l'ID ${id} non trouvée`
        );
      }

      const updateData: Partial<QuartCalendrier> = {};

      if (updateDto.idZone !== undefined) updateData.idZone = updateDto.idZone;
      if (updateDto.idAction !== undefined)
        updateData.idAction = updateDto.idAction;
      if (updateDto.date_heure_debut !== undefined)
        updateData.date_heure_debut = new Date(updateDto.date_heure_debut);
      if (updateDto.quart !== undefined) updateData.quart = updateDto.quart;
      if (updateDto.termine !== undefined)
        updateData.termine = updateDto.termine;
      if (updateDto.date_heure_fin !== undefined)
        updateData.date_heure_fin = new Date(updateDto.date_heure_fin);
      if (updateDto.idUser !== undefined) updateData.idUser = updateDto.idUser;
      if (updateDto.finReccurrence !== undefined)
        updateData.finReccurrence = updateDto.finReccurrence;
      if (updateDto.recurrencePhrase !== undefined)
        updateData.recurrencePhrase = updateDto.recurrencePhrase;

      if (Object.keys(updateData).length > 0) {
        await this.quartCalendrierRepository.update(id, updateData);
      }

      this.logger.log(
        `Entrée calendrier mise à jour: ID ${id}`,
        "QuartCalendrierService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de l'entrée calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async findOccurrences(idUsine: number): Promise<
    {
      type: "zone" | "action";
      idZone: number | null;
      nom: string | null;
      quart: number;
      recurrencePhrase: string | null;
      finReccurrence: string | null;
      premiereOccurrence: Date;
      derniereOccurrence: Date;
      totalOccurrences: number;
    }[]
  > {
    try {
      // Grouper les entrées récurrentes par (idZone, quart, recurrencePhrase)
      // Pour les actions, on joint quart_action et on groupe par nom (chaque occurrence a un idAction différent)
      // On prend MAX(finReccurrence) pour ne garder que la série la plus récente
      const groups = await this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .leftJoin("quart_action", "qa", "qa.id = qc.idAction")
        .select("qc.idZone", "idZone")
        .addSelect("qa.nom", "actionNom")
        .addSelect("qc.quart", "quart")
        .addSelect("MAX(qc.finReccurrence)", "finReccurrence")
        .addSelect("qc.recurrencePhrase", "recurrencePhrase")
        .addSelect("MIN(qc.date_heure_debut)", "premiereOccurrence")
        .addSelect("MAX(qc.date_heure_debut)", "derniereOccurrence")
        .addSelect("COUNT(*)", "totalOccurrences")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.recurrencePhrase IS NOT NULL")
        .groupBy("qc.idZone")
        .addGroupBy("qa.nom")
        .addGroupBy("qc.quart")
        .addGroupBy("qc.recurrencePhrase")
        .orderBy("MAX(qc.date_heure_debut)", "DESC")
        .getRawMany();

      // Récupérer les noms des zones référencées
      const zoneIds = [
        ...new Set(
          groups.filter(g => g.idZone != null).map(g => Number(g.idZone))
        ),
      ];

      const zonesMap = new Map<number, string>();

      // SQL Server limite à 2100 paramètres par requête, on batch par 2000
      const BATCH_SIZE = 2000;

      for (let i = 0; i < zoneIds.length; i += BATCH_SIZE) {
        const batch = zoneIds.slice(i, i + BATCH_SIZE);
        const zones = await this.zoneControleRepository
          .createQueryBuilder("z")
          .where("z.Id IN (:...batch)", { batch })
          .getMany();
        for (const z of zones) {
          zonesMap.set(z.Id, z.nom ?? "");
        }
      }

      return groups.map(g => {
        const isZone = g.idZone != null;
        return {
          type: isZone ? ("zone" as const) : ("action" as const),
          idZone: g.idZone != null ? Number(g.idZone) : null,
          nom: isZone
            ? (zonesMap.get(Number(g.idZone)) ?? null)
            : (g.actionNom ?? null),
          quart: Number(g.quart),
          recurrencePhrase: g.recurrencePhrase,
          finReccurrence: g.finReccurrence,
          premiereOccurrence: new Date(g.premiereOccurrence),
          derniereOccurrence: new Date(g.derniereOccurrence),
          totalOccurrences: Number(g.totalOccurrences),
        };
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des occurrences",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }

  async delete(id: number, idUsine: number): Promise<void> {
    try {
      const existing = await this.quartCalendrierRepository.findOne({
        where: { id, idUsine },
      });

      if (!existing) {
        throw new NotFoundException(
          `Entrée calendrier avec l'ID ${id} non trouvée`
        );
      }

      await this.quartCalendrierRepository.delete(id);

      this.logger.log(
        `Entrée calendrier supprimée: ID ${id}`,
        "QuartCalendrierService"
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de l'entrée calendrier",
        error instanceof Error ? error.stack : String(error),
        "QuartCalendrierService"
      );
      throw error;
    }
  }
}
