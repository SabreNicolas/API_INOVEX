import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ProductNew } from "./product-new.entity";
import { Site } from "./site.entity";

@Entity("import_tonnageReactifs")
export class ImportTonnageReactif {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  ProductId: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ length: 255 })
  productImport: string;

  // Relations
  @ManyToOne(() => ProductNew)
  @JoinColumn({ name: "ProductId", referencedColumnName: "id" })
  product: ProductNew;

  @ManyToOne(() => Site)
  @JoinColumn({ name: "idUsine", referencedColumnName: "id" })
  usine: Site;
}
