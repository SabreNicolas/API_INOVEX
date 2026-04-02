import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { QuartAction } from "./quart-action.entity";
import { User } from "./user.entity";
import { ZoneControle } from "./zone-controle.entity";

/** quart: 1->matin, 2->aprem, 3->nuit | termine: 0->création, 1->fait */
@Entity("quart_calendrier")
@Unique("unique_quart_calendrier", [
  "date_heure_debut",
  "date_heure_fin",
  "quart",
  "idUsine",
  "idZone",
  "idAction",
])
export class QuartCalendrier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "int", nullable: true })
  idZone: number | null;

  @Column({ type: "int", nullable: true })
  idAction: number | null;

  @Column({ type: "datetime" })
  date_heure_debut: Date;

  @Column({ type: "int" })
  quart: number;

  @Column({ type: "tinyint", default: 0 })
  termine: number;

  @Column({ type: "datetime", nullable: true })
  date_heure_fin: Date | null;

  @Column({ type: "int", nullable: true })
  idUser: number | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  finReccurrence: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  recurrencePhrase: string | null;

  @ManyToOne(() => ZoneControle, { nullable: true })
  @JoinColumn({ name: "idZone" })
  zone: ZoneControle | null;

  @ManyToOne(() => QuartAction, { nullable: true })
  @JoinColumn({ name: "idAction" })
  action: QuartAction | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "idUser" })
  user: User | null;
}
