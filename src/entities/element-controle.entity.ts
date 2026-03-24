import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("elementcontrole")
export class ElementControle {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ type: "int", nullable: true })
  zoneId: number | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  nom: string | null;

  @Column({ type: "decimal", precision: 18, scale: 3, nullable: true })
  valeurMin: number | null;

  @Column({ type: "decimal", precision: 18, scale: 3, nullable: true })
  valeurMax: number | null;

  @Column({ type: "nvarchar", length: 45, nullable: true })
  typeChamp: string | null;

  @Column({ type: "nvarchar", length: 45, nullable: true })
  unit: string | null;

  @Column({ type: "nvarchar", length: 45, nullable: true })
  defaultValue: string | null;

  @Column({ type: "bit", nullable: true })
  isRegulateur: boolean | null;

  @Column({ type: "nvarchar", length: 200, nullable: true })
  listValues: string | null;

  @Column({ type: "bit", nullable: true })
  isCompteur: boolean | null;

  @Column({ type: "int", nullable: true })
  ordre: number | null;

  @Column({ type: "int", nullable: true, default: null })
  idGroupement: number | null;

  @Column({ type: "nvarchar", length: 100, nullable: true })
  CodeEquipement: string | null;

  @Column({ length: 200, default: "" })
  infoSup: string;
}
