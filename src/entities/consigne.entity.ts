import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ConsigneType } from "./consigne-type.entity";

@Entity("consigne")
export class Consigne {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 250 })
  titre: string;

  @Column({ type: "nvarchar", length: 1000, nullable: true })
  commentaire: string | null;

  @Column({ type: "datetime", nullable: true })
  date_heure_fin: Date | null;

  @Column({ type: "int", nullable: true })
  type: number | null;

  @Column({ type: "int", default: 1 })
  idUsine: number;

  @Column({ type: "datetime", nullable: true })
  date_heure_debut: Date | null;

  @Column({ type: "nvarchar", length: 250, nullable: true })
  url: string | null;

  @Column({ type: "int", default: 1 })
  isActive: number;

  @ManyToOne(() => ConsigneType)
  @JoinColumn({ name: "type", referencedColumnName: "id" })
  typeConsigne: ConsigneType;
}
