import { Entity, PrimaryColumn } from "typeorm";

@Entity("productcategories_new")
export class ProductCategorieNew {
  @PrimaryColumn({ type: "int" })
  ProductId: number;

  @PrimaryColumn({ type: "int" })
  CategoryId: number;
}
