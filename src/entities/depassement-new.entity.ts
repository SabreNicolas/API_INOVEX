import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("depassements_new")
export class DepassementNew {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  choixDepassements: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  choixDepassementsProduits: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  ligne: string | null;

  @Column({ type: "datetime" })
  date_heure_debut: Date;

  @Column({ type: "datetime" })
  date_heure_fin: Date;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  causes: string | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  concentration: string | null;

  @Column({ type: "int" })
  idUsine: number;
}
