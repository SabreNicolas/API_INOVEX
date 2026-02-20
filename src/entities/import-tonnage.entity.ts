import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("import_tonnage")
export class ImportTonnage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  ProducerId: number;

  @Column({ type: "int" })
  ProductId: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ length: 255 })
  nomImport: string;

  @Column({ length: 255 })
  productImport: string;
}
