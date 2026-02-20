import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("arretsCategories")
export class ArretCategorie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  debCode: string;

  @Column({ length: 50 })
  nom: string;
}
