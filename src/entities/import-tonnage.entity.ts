import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { MoralEntityNew } from "./moral-entity-new.entity";
import { ProductNew } from "./product-new.entity";
import { Site } from "./site.entity";

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

  // Relations
  @ManyToOne(() => MoralEntityNew)
  @JoinColumn({ name: "ProducerId", referencedColumnName: "id" })
  producer: MoralEntityNew;

  @ManyToOne(() => ProductNew)
  @JoinColumn({ name: "ProductId", referencedColumnName: "id" })
  product: ProductNew;

  @ManyToOne(() => Site)
  @JoinColumn({ name: "idUsine", referencedColumnName: "id" })
  usine: Site;
}
