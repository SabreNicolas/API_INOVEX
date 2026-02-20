import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("import_tonnage_parametres_sens")
export class ImportTonnageParametreSens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  sens: string;

  @Column({ length: 50 })
  correspondanceFichier: string;
}
