import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("enregistrement_affectation_equipe")
export class EnregistrementAffectationEquipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idRondier: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "idRondier" })
  rondier: User;

  @Column({ type: "int" })
  idEquipe: number;

  @Column({ length: 100, default: "" })
  poste: string;
}
