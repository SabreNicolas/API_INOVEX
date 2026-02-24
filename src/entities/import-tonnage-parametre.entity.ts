import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Site } from "./site.entity";

@Entity("import_tonnage_parametres")
export class ImportTonnageParametre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 2, default: ";" })
  delimiter: string;

  @Column({ type: "bit", default: true })
  header: boolean;

  @Column({ type: "int" })
  client: number;

  @Column({ type: "int" })
  typeDechet: number;

  @Column({ type: "int" })
  dateEntree: number;

  @Column({ type: "int" })
  tonnage: number;

  @Column({ type: "int" })
  entreeSortie: number;

  @Column({ type: "int" })
  idUsine: number;

  // Relations
  @ManyToOne(() => Site)
  @JoinColumn({ name: "idUsine", referencedColumnName: "id" })
  usine: Site;
}
