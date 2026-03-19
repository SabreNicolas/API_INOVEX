import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AffectationEquipe } from "./affectation-equipe.entity";
import { User } from "./user.entity";

@Entity("equipe")
export class Equipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  equipe: string;

  @Column({ type: "int" })
  quart: number;

  @Column({ type: "int" })
  idChefQuart: number;

  @Column({ type: "date", nullable: true })
  date: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "idChefQuart" })
  chefQuart: User;

  @OneToMany(() => AffectationEquipe, aff => aff.equipeEntity)
  affectations: AffectationEquipe[];
}
