import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("arretsSousCategories")
export class ArretSousCategorie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 150 })
  nom: string;
}
