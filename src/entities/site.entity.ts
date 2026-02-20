import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("site")
export class Site {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  localisation: string;

  @Column({ length: 50 })
  codeUsine: string;

  @Column({ type: "int", nullable: true })
  nbLigne: number | null;

  @Column({ type: "int", nullable: true })
  nbGTA: number | null;

  @Column({ type: "int", nullable: true })
  nbReseauChaleur: number | null;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  typeImport: string | null;

  @Column({ length: 3, default: "A" })
  typeRondier: string;

  @Column({ length: 30, default: "" })
  ipAveva: string;

  @Column({ type: "tinyint", default: 0 })
  validationDonnees: number;

  @Column({ type: "time", nullable: true, default: "05:00" })
  debutQuartMatin: string | null;

  @Column({ type: "time", nullable: true, default: "13:00" })
  finQuartMatin: string | null;

  @Column({ type: "time", nullable: true, default: "13:00" })
  debutQuartAM: string | null;

  @Column({ type: "time", nullable: true, default: "21:00" })
  finQuartAM: string | null;

  @Column({ type: "time", nullable: true, default: "21:00" })
  debutQuartNuit: string | null;

  @Column({ type: "time", nullable: true, default: "05:00" })
  finQuartNuit: string | null;

  @Column({ type: "int", default: 2 })
  margeHeuresQuart: number;
}
