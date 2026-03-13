import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_actualite")
export class QuartActualite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ length: 250 })
  titre: string;

  @Column({ type: "datetime" })
  date_heure_debut: Date;

  @Column({ type: "datetime" })
  date_heure_fin: Date;

  @Column({ type: "int", default: 1 })
  importance: number;

  @Column({ type: "tinyint", default: 0 })
  isQuart: number;

  @Column({ type: "tinyint", default: 1 })
  isActive: number;

  @Column({ type: "nvarchar", length: 2000, nullable: true })
  description: string | null;
}
