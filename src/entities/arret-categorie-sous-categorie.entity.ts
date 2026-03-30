import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

import { ArretCategorie } from "./arret-categorie.entity";
import { ArretSousCategorie } from "./arret-sous-categorie.entity";

@Entity("arretsCategories_arretsSousCategories")
export class ArretCategorieSousCategorie {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => ArretCategorie, { nullable: false })
  @JoinColumn({ name: "idArretsCategories" })
  arretCategorie: ArretCategorie;

  @ManyToOne(() => ArretSousCategorie, { nullable: false })
  @JoinColumn({ name: "idArretsSousCategories" })
  arretSousCategorie: ArretSousCategorie;
}
