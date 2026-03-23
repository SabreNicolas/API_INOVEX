import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "../../common/services/logger.service";
import {
  Anomalie,
  ElementControle,
  Groupement,
  MesureRondier,
  QuartCalendrier,
  RepriseRonde,
  Ronde,
  ZoneControle,
} from "../../entities";

export interface RondeWithDetails {
  ronde: Ronde;
  zones: ZoneWithElements[];
}

export interface ZoneWithElements {
  zone: ZoneControle;
  groupements: GroupementWithElements[];
  anomalies: Anomalie[];
}

export interface GroupementWithElements {
  groupement: Groupement | null;
  elements: ElementWithMesure[];
}

export interface ElementWithMesure {
  element: ElementControle;
  mesure: MesureRondier | null;
}

// Interfaces pour RepriseRonde
export interface RepriseRondeWithDetails {
  repriseRonde: RepriseRonde | null;
  zones: ZoneWithGroupements[];
}

export interface ZoneWithGroupements {
  zone: ZoneControle;
  groupements: GroupementWithElementsSimple[];
}

export interface GroupementWithElementsSimple {
  groupement: Groupement | null;
  elements: ElementControle[];
}

@Injectable()
export class RondeService {
  constructor(
    @InjectRepository(Ronde)
    private readonly rondeRepository: Repository<Ronde>,
    @InjectRepository(ZoneControle)
    private readonly zoneControleRepository: Repository<ZoneControle>,
    @InjectRepository(Groupement)
    private readonly groupementRepository: Repository<Groupement>,
    @InjectRepository(ElementControle)
    private readonly elementControleRepository: Repository<ElementControle>,
    @InjectRepository(MesureRondier)
    private readonly mesureRondierRepository: Repository<MesureRondier>,
    @InjectRepository(Anomalie)
    private readonly anomalieRepository: Repository<Anomalie>,
    @InjectRepository(QuartCalendrier)
    private readonly quartCalendrierRepository: Repository<QuartCalendrier>,
    @InjectRepository(RepriseRonde)
    private readonly repriseRondeRepository: Repository<RepriseRonde>,
    private readonly logger: LoggerService
  ) {}

  /**
   * Récupère les rondes pour une date et un quart donnés, avec les éléments de contrôle,
   * mesures et anomalies associés pour le site de l'utilisateur.
   */
  async findByDateAndQuart(
    idUsine: number,
    date: string,
    quart: number
  ): Promise<RondeWithDetails[]> {
    try {
      // 1. Récupérer les rondes pour la date, le quart et le site
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      //date au format DD/MM/YYYY pour comparaison avec dateHeure qui est au format string
      const dateFormat = `${startOfDay.getDate().toString().padStart(2, "0")}/${(
        startOfDay.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${startOfDay.getFullYear()}`;
      console.log("dateFormat", dateFormat);
      const rondes = await this.rondeRepository
        .createQueryBuilder("ronde")
        .leftJoinAndSelect("ronde.user", "user")
        .leftJoinAndSelect("ronde.chefQuart", "chefQuart")
        .where("ronde.idUsine = :idUsine", { idUsine })
        .andWhere("ronde.quart = :quart", { quart })
        .andWhere("ronde.dateHeure = :date", { date: dateFormat })
        .orderBy("ronde.dateHeureCreation", "ASC")
        .getMany();

      if (rondes.length === 0) {
        return [];
      }

      // 2. Récupérer les zones du calendrier pour cette date et ce quart
      const calendrierZones = await this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .select("DISTINCT qc.idZone", "idZone")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.quart = :quart", { quart })
        .andWhere("qc.date_heure_debut >= :startOfDay", { startOfDay })
        .andWhere("qc.date_heure_debut <= :endOfDay", { endOfDay })
        .andWhere("qc.idZone IS NOT NULL")
        .getRawMany();

      const calendrierZoneIds = calendrierZones
        .map(row => row.idZone)
        .filter((id): id is number => id !== null);
      console.log("calendrierZoneIds", calendrierZoneIds);

      // 3. Si des zones sont définies dans le calendrier, les utiliser, sinon toutes les zones du site
      let zones: ZoneControle[];
      if (calendrierZoneIds.length > 0) {
        zones = await this.zoneControleRepository
          .createQueryBuilder("z")
          .where("z.Id IN (:...zoneIds)", { zoneIds: calendrierZoneIds })
          .andWhere("z.idUsine = :idUsine", { idUsine })
          .orderBy("z.nom", "ASC")
          .getMany();
      } else {
        zones = await this.zoneControleRepository.find({
          where: { idUsine },
          order: { nom: "ASC" },
        });
      }

      const zoneIds = zones.map(z => z.Id);

      // 4. Récupérer les groupements pour les zones
      const groupements =
        zoneIds.length > 0
          ? await this.groupementRepository
              .createQueryBuilder("g")
              .where("g.zoneId IN (:...zoneIds)", { zoneIds })
              .orderBy("g.groupement", "ASC")
              .getMany()
          : [];

      // 5. Récupérer les éléments de contrôle pour les zones
      const elements =
        zoneIds.length > 0
          ? await this.elementControleRepository
              .createQueryBuilder("e")
              .where("e.zoneId IN (:...zoneIds)", { zoneIds })
              .orderBy("e.ordre", "ASC")
              .addOrderBy("e.nom", "ASC")
              .getMany()
          : [];

      // Construire la réponse pour chaque ronde
      const result: RondeWithDetails[] = [];

      for (const ronde of rondes) {
        // 6. Récupérer les mesures pour cette ronde
        const mesures = await this.mesureRondierRepository.find({
          where: { rondeId: ronde.Id },
        });

        // 7. Récupérer les anomalies pour cette ronde
        const anomalies = await this.anomalieRepository.find({
          where: { rondeId: ronde.Id },
          relations: ["zone"],
        });

        // Créer un map des mesures par elementId pour un accès rapide
        const mesuresByElementId = new Map<number, MesureRondier>();
        for (const mesure of mesures) {
          if (mesure.elementId !== null) {
            mesuresByElementId.set(mesure.elementId, mesure);
          }
        }

        // Construire la structure zones avec groupements et éléments
        const zonesWithElements: ZoneWithElements[] = [];

        for (const zone of zones) {
          // Groupements de cette zone
          const zoneGroupements = groupements.filter(g => g.zoneId === zone.Id);

          // Éléments de cette zone
          const zoneElements = elements.filter(e => e.zoneId === zone.Id);

          // Anomalies de cette zone pour cette ronde
          const zoneAnomalies = anomalies.filter(a => a.zoneId === zone.Id);

          // Grouper les éléments par groupement
          const groupementsWithElements: GroupementWithElements[] = [];

          // Éléments sans groupement (idGroupement = null)
          const elementsWithoutGroupement = zoneElements.filter(
            e => e.idGroupement === null
          );

          if (elementsWithoutGroupement.length > 0) {
            groupementsWithElements.push({
              groupement: null,
              elements: elementsWithoutGroupement.map(element => ({
                element,
                mesure: mesuresByElementId.get(element.Id) || null,
              })),
            });
          }

          // Éléments avec groupement
          for (const groupement of zoneGroupements) {
            const groupementElements = zoneElements.filter(
              e => e.idGroupement === groupement.id
            );

            if (groupementElements.length > 0) {
              groupementsWithElements.push({
                groupement,
                elements: groupementElements.map(element => ({
                  element,
                  mesure: mesuresByElementId.get(element.Id) || null,
                })),
              });
            }
          }

          if (groupementsWithElements.length > 0 || zoneAnomalies.length > 0) {
            zonesWithElements.push({
              zone,
              groupements: groupementsWithElements,
              anomalies: zoneAnomalies,
            });
          }
        }

        result.push({
          ronde,
          zones: zonesWithElements,
        });
      }

      this.logger.log(
        `Rondes récupérées: ${result.length} pour date=${date}, quart=${quart}, usine=${idUsine}`,
        "RondeService"
      );

      return result;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des rondes par date et quart",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Met à jour une mesure rondier.
   */
  async updateMesure(
    id: number,
    updateData: { modeRegulateur?: string; value?: string }
  ): Promise<MesureRondier> {
    try {
      const mesure = await this.mesureRondierRepository.findOne({
        where: { id },
      });

      if (!mesure) {
        throw new NotFoundException(
          `Mesure rondier avec l'ID ${id} non trouvée`
        );
      }

      if (updateData.modeRegulateur !== undefined) {
        mesure.modeRegulateur = updateData.modeRegulateur;
      }
      if (updateData.value !== undefined) {
        mesure.value = updateData.value;
      }

      const saved = await this.mesureRondierRepository.save(mesure);

      this.logger.log(`Mesure rondier mise à jour (ID: ${id})`, "RondeService");

      return saved;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la mise à jour de la mesure rondier",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  // ==================== RepriseRonde CRUD ====================

  /**
   * Récupère toutes les reprises de ronde pour un site.
   */
  async findAllRepriseRonde(idUsine: number): Promise<RepriseRonde[]> {
    try {
      return this.repriseRondeRepository.find({
        where: { idUsine },
        order: { date: "DESC", quart: "ASC" },
      });
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération des reprises de ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Récupère une reprise de ronde par ID.
   */
  async findOneRepriseRonde(
    id: number,
    idUsine: number
  ): Promise<RepriseRonde> {
    try {
      const repriseRonde = await this.repriseRondeRepository.findOne({
        where: { id, idUsine },
      });

      if (!repriseRonde) {
        throw new NotFoundException(
          `Reprise de ronde avec l'ID ${id} non trouvée`
        );
      }

      return repriseRonde;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la récupération de la reprise de ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Récupère une reprise de ronde par date et quart avec les zones, groupements et éléments.
   */
  async findRepriseRondeByDateAndQuart(
    idUsine: number,
    date: string,
    quart: number
  ): Promise<RepriseRondeWithDetails> {
    try {
      // 1. Récupérer la reprise de ronde
      const repriseRonde = await this.repriseRondeRepository.findOne({
        where: { idUsine, date, quart },
      });

      // 2. Récupérer les zones du calendrier pour cette date et ce quart
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const calendrierZones = await this.quartCalendrierRepository
        .createQueryBuilder("qc")
        .select("DISTINCT qc.idZone", "idZone")
        .where("qc.idUsine = :idUsine", { idUsine })
        .andWhere("qc.quart = :quart", { quart })
        .andWhere("qc.date_heure_debut >= :startOfDay", { startOfDay })
        .andWhere("qc.date_heure_debut <= :endOfDay", { endOfDay })
        .andWhere("qc.idZone IS NOT NULL")
        .getRawMany();

      const calendrierZoneIds = calendrierZones
        .map(row => row.idZone)
        .filter((id): id is number => id !== null);

      // 3. Si des zones sont définies dans le calendrier, les utiliser, sinon toutes les zones du site
      let zones: ZoneControle[];
      if (calendrierZoneIds.length > 0) {
        zones = await this.zoneControleRepository
          .createQueryBuilder("z")
          .where("z.Id IN (:...zoneIds)", { zoneIds: calendrierZoneIds })
          .andWhere("z.idUsine = :idUsine", { idUsine })
          .orderBy("z.nom", "ASC")
          .getMany();
      } else {
        zones = await this.zoneControleRepository.find({
          where: { idUsine },
          order: { nom: "ASC" },
        });
      }

      const zoneIds = zones.map(z => z.Id);

      // 4. Récupérer les groupements pour les zones
      const groupements =
        zoneIds.length > 0
          ? await this.groupementRepository
              .createQueryBuilder("g")
              .where("g.zoneId IN (:...zoneIds)", { zoneIds })
              .orderBy("g.groupement", "ASC")
              .getMany()
          : [];

      // 5. Récupérer les éléments de contrôle pour les zones
      const elements =
        zoneIds.length > 0
          ? await this.elementControleRepository
              .createQueryBuilder("e")
              .where("e.zoneId IN (:...zoneIds)", { zoneIds })
              .orderBy("e.ordre", "ASC")
              .addOrderBy("e.nom", "ASC")
              .getMany()
          : [];

      // 6. Construire la structure zones avec groupements et éléments
      const zonesWithGroupements: ZoneWithGroupements[] = [];

      for (const zone of zones) {
        const zoneGroupements = groupements.filter(g => g.zoneId === zone.Id);
        const zoneElements = elements.filter(e => e.zoneId === zone.Id);

        const groupementsWithElements: GroupementWithElementsSimple[] = [];

        // Éléments sans groupement (idGroupement = null)
        const elementsWithoutGroupement = zoneElements.filter(
          e => e.idGroupement === null
        );

        if (elementsWithoutGroupement.length > 0) {
          groupementsWithElements.push({
            groupement: null,
            elements: elementsWithoutGroupement,
          });
        }

        // Éléments avec groupement
        for (const groupement of zoneGroupements) {
          const groupementElements = zoneElements.filter(
            e => e.idGroupement === groupement.id
          );

          if (groupementElements.length > 0) {
            groupementsWithElements.push({
              groupement,
              elements: groupementElements,
            });
          }
        }

        if (groupementsWithElements.length > 0) {
          zonesWithGroupements.push({
            zone,
            groupements: groupementsWithElements,
          });
        }
      }

      this.logger.log(
        `Reprise de ronde récupérée pour date=${date}, quart=${quart}, usine=${idUsine}, zones=${zonesWithGroupements.length}`,
        "RondeService"
      );

      return {
        repriseRonde,
        zones: zonesWithGroupements,
      };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la récupération de la reprise de ronde par date et quart",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Crée une nouvelle reprise de ronde.
   */
  async createRepriseRonde(
    idUsine: number,
    createData: { date: string; quart: number }
  ): Promise<RepriseRonde> {
    try {
      // Vérifier si une reprise existe déjà pour cette date/quart/usine
      const existing = await this.repriseRondeRepository.findOne({
        where: { idUsine, date: createData.date, quart: createData.quart },
      });

      if (existing) {
        throw new Error(
          `Une reprise de ronde existe déjà pour cette date et ce quart`
        );
      }

      const repriseRonde = this.repriseRondeRepository.create({
        date: createData.date,
        quart: createData.quart,
        idUsine,
        termine: 0,
      });

      const saved = await this.repriseRondeRepository.save(repriseRonde);

      this.logger.log(
        `Reprise de ronde créée (ID: ${saved.id})`,
        "RondeService"
      );

      return saved;
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la reprise de ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Met à jour une reprise de ronde.
   */
  async updateRepriseRonde(
    id: number,
    idUsine: number,
    updateData: { termine?: number }
  ): Promise<RepriseRonde> {
    try {
      const repriseRonde = await this.repriseRondeRepository.findOne({
        where: { id, idUsine },
      });

      if (!repriseRonde) {
        throw new NotFoundException(
          `Reprise de ronde avec l'ID ${id} non trouvée`
        );
      }

      if (updateData.termine !== undefined) {
        repriseRonde.termine = updateData.termine;
      }

      const saved = await this.repriseRondeRepository.save(repriseRonde);

      this.logger.log(
        `Reprise de ronde mise à jour (ID: ${id})`,
        "RondeService"
      );

      return saved;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la mise à jour de la reprise de ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  /**
   * Supprime une reprise de ronde.
   */
  async deleteRepriseRonde(id: number, idUsine: number): Promise<void> {
    try {
      const repriseRonde = await this.repriseRondeRepository.findOne({
        where: { id, idUsine },
      });

      if (!repriseRonde) {
        throw new NotFoundException(
          `Reprise de ronde avec l'ID ${id} non trouvée`
        );
      }

      await this.repriseRondeRepository.remove(repriseRonde);

      this.logger.log(`Reprise de ronde supprimée (ID: ${id})`, "RondeService");
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        "Erreur lors de la suppression de la reprise de ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }

  // ==================== Ronde CRUD ====================

  /**
   * Crée une nouvelle ronde avec ses mesures rondier.
   */
  async createRonde(
    idUsine: number,
    userId: number,
    createData: {
      dateHeure?: string;
      quart: number;
      commentaire?: string;
      isFinished?: boolean;
      fonctFour1?: boolean;
      fonctFour2?: boolean;
      fonctFour3?: boolean;
      fonctFour4?: boolean;
      chefQuartId?: number;
      repriseRondeId?: number;
      mesures: {
        elementId: number;
        modeRegulateur?: string;
        value?: string;
      }[];
    }
  ): Promise<{ ronde: Ronde; mesures: MesureRondier[] }> {
    try {
      // 1. Créer la ronde
      const ronde = this.rondeRepository.create({
        dateHeure: createData.dateHeure || null,
        quart: createData.quart,
        userId,
        commentaire: createData.commentaire || null,
        isFinished: createData.isFinished ?? false,
        fonctFour1: createData.fonctFour1 ?? false,
        fonctFour2: createData.fonctFour2 ?? false,
        fonctFour3: createData.fonctFour3 ?? false,
        fonctFour4: createData.fonctFour4 ?? false,
        chefQuartId: createData.chefQuartId || null,
        idUsine,
        urlPDF: "",
        dateHeureCreation: new Date(),
      });

      const savedRonde = await this.rondeRepository.save(ronde);

      // 2. Créer les mesures rondier
      const mesures: MesureRondier[] = [];
      const now = new Date();

      for (const mesureData of createData.mesures) {
        const mesure = this.mesureRondierRepository.create({
          elementId: mesureData.elementId,
          modeRegulateur: mesureData.modeRegulateur || null,
          value: mesureData.value || null,
          rondeId: savedRonde.Id,
          dateHeure: now,
        });
        const savedMesure = await this.mesureRondierRepository.save(mesure);
        mesures.push(savedMesure);
      }

      // 3. Mettre à jour la reprise de ronde si fournie
      if (createData.repriseRondeId) {
        const repriseRonde = await this.repriseRondeRepository.findOne({
          where: { id: createData.repriseRondeId, idUsine },
        });
        if (repriseRonde) {
          repriseRonde.termine = 1;
          await this.repriseRondeRepository.save(repriseRonde);
          this.logger.log(
            `Reprise de ronde (ID: ${createData.repriseRondeId}) marquée comme terminée`,
            "RondeService"
          );
        }
      }

      this.logger.log(
        `Ronde créée (ID: ${savedRonde.Id}) avec ${mesures.length} mesures`,
        "RondeService"
      );

      return { ronde: savedRonde, mesures };
    } catch (error) {
      this.logger.error(
        "Erreur lors de la création de la ronde",
        error instanceof Error ? error.stack : String(error),
        "RondeService"
      );
      throw error;
    }
  }
}
