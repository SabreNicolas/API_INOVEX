import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("choixDepassementsProduits")
export class ChoixDepassementProduit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 50, nullable: true, unique: true })
  nom: string | null;
}
