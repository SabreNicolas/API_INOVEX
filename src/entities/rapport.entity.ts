import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("rapport")
export class Rapport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nom: string;

  @Column({ type: "varchar", length: "max" })
  url: string;

  @Column({ type: "int" })
  idUsine: number;
}
