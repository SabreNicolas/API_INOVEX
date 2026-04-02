import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ArretCategorie } from "./arret-categorie.entity";

@Entity("arrets_arretsCategories")
export class ArretArretCategorie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 50 })
  nomContient: string;

  @Column({ type: "int" })
  importance: number;

  @ManyToOne(() => ArretCategorie, { nullable: false })
  @JoinColumn({ name: "idArretsCategories" })
  arretCategorie: ArretCategorie;
}
