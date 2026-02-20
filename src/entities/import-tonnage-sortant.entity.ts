import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("import_tonnageSortants")
export class ImportTonnageSortant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  ProductId: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ length: 255 })
  productImport: string;
}
