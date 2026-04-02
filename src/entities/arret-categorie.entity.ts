import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("arretsCategories")
export class ArretCategorie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 150 })
  nom: string;
}
