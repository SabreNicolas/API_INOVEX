import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_evenement")
export class QuartEvenement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "nvarchar", length: 250, nullable: true })
  groupementGMAO: string | null;

  @Column({ type: "nvarchar", length: 250, nullable: true })
  equipementGMAO: string | null;

  @Column({ length: 250 })
  titre: string;

  @Column({ length: 1000 })
  description: string;

  @Column({ type: "datetime" })
  date_heure_debut: Date;

  @Column({ type: "datetime" })
  date_heure_fin: Date;

  @Column({ type: "int", default: 1 })
  importance: number;

  @Column({ length: 10, default: "0" })
  demande_travaux: string;

  @Column({ type: "tinyint", default: 0 })
  consigne: number;

  @Column({ type: "nvarchar", length: 250, nullable: true })
  cause: string | null;

  @Column({ type: "nvarchar", length: 250, nullable: true })
  url: string | null;

  @Column({ type: "int", default: 1 })
  isActive: number;
}
