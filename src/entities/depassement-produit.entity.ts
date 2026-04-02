import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("depassements_produits")
@Unique("uniq", ["idChoixDepassements", "idChoixDepassementsProduits"])
export class DepassementProduit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idChoixDepassementsProduits: number;

  @Column({ type: "int" })
  idChoixDepassements: number;
}
