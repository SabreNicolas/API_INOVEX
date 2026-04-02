import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Equipe } from "./equipe.entity";
import { User } from "./user.entity";

@Entity("affectation_equipe")
export class AffectationEquipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idRondier: number;

  @Column({ type: "int" })
  idEquipe: number;

  @Column({ type: "int" })
  idZone: number;

  @Column({ length: 50 })
  poste: string;

  @Column({ type: "time", default: "" })
  heure_deb: string;

  @Column({ type: "time", default: "" })
  heure_fin: string;

  @Column({ type: "time", default: "00:00" })
  heure_tp: string;

  @Column({ length: 255, default: "" })
  comm_tp: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "idRondier" })
  rondier: User;

  @ManyToOne(() => Equipe, equipe => equipe.affectations)
  @JoinColumn({ name: "idEquipe" })
  equipeEntity: Equipe;
}
