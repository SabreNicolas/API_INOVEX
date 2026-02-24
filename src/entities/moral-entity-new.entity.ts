import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

import { ImportTonnage } from "./import-tonnage.entity";
import { ProductNew } from "./product-new.entity";

@Entity("moralentities_new")
export class MoralEntityNew {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "datetime2", nullable: true })
  CreateDate: Date | null;

  @Column({ type: "datetime2", nullable: true })
  LastModifiedDate: Date | null;

  @Column({ type: "nvarchar", length: 150, nullable: true })
  Name: string | null;

  @Column({ type: "nvarchar", length: 50, nullable: true })
  Address: string | null;

  @Column({ type: "tinyint", nullable: true })
  Enabled: number | null;

  @Column({ type: "nvarchar", length: 15, nullable: true })
  Code: string | null;

  @Column({ type: "decimal", precision: 18, scale: 2, nullable: true })
  UnitPrice: number | null;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  numCAP: string | null;

  @Column({ type: "nvarchar", length: 15, nullable: true })
  codeDechet: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  nomClient: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  prenomClient: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  mailClient: string | null;

  @Column({ type: "int", nullable: true })
  idUsine: number | null;

  // Relations
  @OneToMany(() => ImportTonnage, importTonnage => importTonnage.producer)
  importTonnages: ImportTonnage[];

  // Virtual property for join on Code
  product?: ProductNew;
}
