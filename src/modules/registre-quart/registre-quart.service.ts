import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LoggerService } from "@/common/services/logger.service";
import {
  AffectationEquipe,
  Anomalie,
  Consigne,
  Equipe,
  QuartActualite,
  QuartCalendrier,
  QuartEvenement,
  Site,
} from "@/entities";

export interface RegistreQuartData {
  siteName: string;
  date: string;
  quartLabel: string;
  quart: number;
  equipeNom: string;
  affectations: {
    poste: string;
    nomPrenom: string;
    heureDebut: string;
    heureFin: string;
    travauxPenible: string;
  }[];
  consignes: { titre: string; commentaire: string }[];
  actions: { heure: string; nom: string }[];
  evenements: {
    dateHeure: string;
    titre: string;
    description: string;
    cause: string;
  }[];
  zones: { nom: string; controlePar: string; termine: boolean }[];
  actualites: { titre: string; description: string }[];
  anomalies: { commentaire: string }[];
  cdqSortant: string;
  cdqEntrant: string;
}

@Injectable()
export class RegistreQuartService {
  constructor(
    @InjectRepository(Equipe)
    private readonly equipeRepository: Repository<Equipe>,
    @InjectRepository(AffectationEquipe)
    private readonly affectationEquipeRepository: Repository<AffectationEquipe>,
    @InjectRepository(QuartEvenement)
    private readonly quartEvenementRepository: Repository<QuartEvenement>,
    @InjectRepository(Consigne)
    private readonly consigneRepository: Repository<Consigne>,
    @InjectRepository(QuartCalendrier)
    private readonly quartCalendrierRepository: Repository<QuartCalendrier>,
    @InjectRepository(QuartActualite)
    private readonly quartActualiteRepository: Repository<QuartActualite>,
    @InjectRepository(Anomalie)
    private readonly anomalieRepository: Repository<Anomalie>,
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,
    private readonly logger: LoggerService
  ) {}

  async getLastShift(
    idUsine: number
  ): Promise<{ date: string; quart: number } | null> {
    const equipe = await this.equipeRepository
      .createQueryBuilder("e")
      .innerJoin("users", "chef", "chef.Id = e.idChefQuart")
      .where("chef.idUsine = :idUsine", { idUsine })
      .orderBy("e.date", "DESC")
      .addOrderBy("e.quart", "DESC")
      .getOne();

    if (!equipe || !equipe.date) {
      return null;
    }

    return { date: equipe.date, quart: equipe.quart };
  }

  async getRegistreData(
    idUsine: number,
    date: string,
    quart: number,
    cdqEntrantName: string
  ): Promise<RegistreQuartData> {
    const site = await this.siteRepository.findOne({
      where: { id: idUsine },
    });
    if (!site) {
      throw new NotFoundException(`Site avec l'ID ${idUsine} non trouvé`);
    }

    // Determine shift time range
    const { dateDebut, dateFin } = this.getShiftDateRange(site, date, quart);

    // Load equipe for this date/quart
    const equipe = await this.equipeRepository
      .createQueryBuilder("e")
      .leftJoinAndSelect("e.chefQuart", "chef")
      .where("e.date = :date", { date })
      .andWhere("e.quart = :quart", { quart })
      .getOne();

    let affectations: AffectationEquipe[] = [];
    let equipeNom = "";
    let cdqSortant = "";

    if (equipe) {
      equipeNom = equipe.equipe;
      cdqSortant = equipe.chefQuart
        ? `${equipe.chefQuart.nom} ${equipe.chefQuart.prenom}`.trim()
        : "";
      affectations = await this.affectationEquipeRepository.find({
        where: { idEquipe: equipe.id },
        relations: ["rondier"],
        order: { id: "ASC" },
      });
    }

    // Load events
    const evenements = await this.quartEvenementRepository
      .createQueryBuilder("e")
      .where("e.idUsine = :idUsine", { idUsine })
      .andWhere("e.isActive = 1")
      .andWhere(
        "(e.date_heure_debut BETWEEN :dateDebut AND :dateFin OR e.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (e.date_heure_debut <= :dateDebut AND e.date_heure_fin >= :dateFin))",
        { dateDebut, dateFin }
      )
      .orderBy("e.date_heure_debut", "ASC")
      .getMany();

    // Load consignes
    const consignes = await this.consigneRepository
      .createQueryBuilder("c")
      .leftJoinAndSelect("c.typeConsigne", "type")
      .where("c.idUsine = :idUsine", { idUsine })
      .andWhere("c.isActive = 1")
      .andWhere(
        "(c.date_heure_debut BETWEEN :dateDebut AND :dateFin OR c.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (c.date_heure_debut <= :dateDebut AND (c.date_heure_fin >= :dateFin OR c.date_heure_fin IS NULL)))",
        { dateDebut, dateFin }
      )
      .orderBy("c.date_heure_debut", "ASC")
      .getMany();

    // Load zones (from quart_calendrier where idZone is not null)
    const zonesCalendrier = await this.quartCalendrierRepository
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.zone", "zone")
      .leftJoinAndSelect("qc.user", "user")
      .where("qc.idUsine = :idUsine", { idUsine })
      .andWhere("qc.idZone IS NOT NULL")
      .andWhere(
        "(qc.date_heure_debut = :dateDebut AND qc.date_heure_fin = :dateFin)",
        { dateDebut, dateFin }
      )
      .orderBy("qc.date_heure_debut", "ASC")
      .getMany();

    // Load actions (from quart_calendrier where idAction is not null)
    const actionsCalendrier = await this.quartCalendrierRepository
      .createQueryBuilder("qc")
      .leftJoinAndSelect("qc.action", "action")
      .leftJoinAndSelect("qc.user", "user")
      .where("qc.idUsine = :idUsine", { idUsine })
      .andWhere("qc.idAction IS NOT NULL")
      .andWhere(
        "(qc.date_heure_debut = :dateDebut AND qc.date_heure_fin = :dateFin)",
        { dateDebut, dateFin }
      )
      .orderBy("qc.date_heure_debut", "ASC")
      .getMany();

    // Load actualites
    const actualites = await this.quartActualiteRepository
      .createQueryBuilder("a")
      .where("a.idUsine = :idUsine", { idUsine })
      .andWhere("a.isActive = 1")
      .andWhere(
        "(a.date_heure_debut BETWEEN :dateDebut AND :dateFin OR a.date_heure_fin BETWEEN :dateDebut AND :dateFin OR (a.date_heure_debut <= :dateDebut AND (a.date_heure_fin >= :dateFin OR a.date_heure_fin IS NULL)))",
        { dateDebut, dateFin }
      )
      .orderBy("a.date_heure_debut", "ASC")
      .getMany();

    // Load anomalies linked to zones of this shift
    const zoneIds = zonesCalendrier.filter(z => z.zone).map(z => z.zone!.id);
    let anomalies: Anomalie[] = [];
    if (zoneIds.length > 0) {
      anomalies = await this.anomalieRepository
        .createQueryBuilder("an")
        .where("an.zoneId IN (:...zoneIds)", { zoneIds })
        .getMany();
    }

    const quartLabel = this.getQuartLabel(quart);
    const fmtDate = this.formatDateFr(date);

    return {
      siteName: site.localisation,
      date: fmtDate,
      quartLabel,
      quart,
      equipeNom,
      affectations: affectations.map(a => ({
        poste: a.poste || "",
        nomPrenom: a.rondier
          ? `${a.rondier.nom} ${a.rondier.prenom}`.trim()
          : "",
        heureDebut: this.formatTime(a.heure_deb),
        heureFin: this.formatTime(a.heure_fin),
        travauxPenible: this.formatTime(a.heure_tp),
      })),
      consignes: consignes.map(c => ({
        titre: c.titre,
        commentaire: c.commentaire || "",
      })),
      actions: actionsCalendrier.map(a => ({
        heure: a.action?.nom?.match(/^\d{2}:\d{2}/)
          ? a.action.nom.substring(0, 5)
          : "",
        nom: a.action?.nom?.match(/^\d{2}:\d{2}/)
          ? a.action.nom.substring(6).trim()
          : a.action?.nom || "",
      })),
      evenements: evenements.map(e => ({
        dateHeure: this.formatDateTimeFr(e.date_heure_debut),
        titre: e.titre,
        description: e.description || "",
        cause: e.cause || "Non spécifiée",
      })),
      zones: zonesCalendrier.map(z => ({
        nom: z.zone?.nom || "",
        controlePar: z.user ? `${z.user.prenom} ${z.user.nom}`.trim() : "",
        termine: z.termine === 1,
      })),
      actualites: actualites.map(a => ({
        titre: a.titre,
        description: a.description || "",
      })),
      anomalies: anomalies.map(a => ({
        commentaire: a.commentaire || "",
      })),
      cdqSortant,
      cdqEntrant: cdqEntrantName,
    };
  }

  private getShiftDateRange(
    site: Site,
    date: string,
    quart: number
  ): { dateDebut: Date; dateFin: Date } {
    let debutTime: string;
    let finTime: string;

    switch (quart) {
      case 1:
        debutTime = site.debutQuartMatin || "05:00:00";
        finTime = site.finQuartMatin || "13:00:00";
        break;
      case 2:
        debutTime = site.debutQuartAM || "13:00:00";
        finTime = site.finQuartAM || "21:00:00";
        break;
      case 3:
        debutTime = site.debutQuartNuit || "21:00:00";
        finTime = site.finQuartNuit || "05:00:00";
        break;
      default:
        debutTime = "00:00:00";
        finTime = "23:59:59";
    }

    const dateDebut = new Date(`${date}T${debutTime}`);
    const dateFin = new Date(`${date}T${finTime}`);

    // Night shift goes through midnight
    if (dateFin <= dateDebut) {
      dateFin.setDate(dateFin.getDate() + 1);
    }

    return { dateDebut, dateFin };
  }

  private getQuartLabel(quart: number): string {
    switch (quart) {
      case 1:
        return "Matin";
      case 2:
        return "Apres-midi";
      case 3:
        return "Nuit";
      default:
        return "Quart";
    }
  }

  private formatDateFr(dateStr: string): string {
    const [y, m, d] = dateStr.split("-");
    return `${d}-${m}-${y}`;
  }

  private formatDateTimeFr(date: Date): string {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${d}/${m}/${y} ${hh}:${mm}:${ss}`;
  }

  private formatTime(time: string): string {
    if (!time) return "00:00";
    const parts = time.split(":");
    return `${parts[0]}:${parts[1]}`;
  }
}
