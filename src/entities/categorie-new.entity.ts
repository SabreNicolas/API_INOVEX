import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("categories_new")
export class CategorieNew {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "datetime", nullable: true })
  CreateDate: Date | null;

  @Column({ type: "datetime", nullable: true })
  LastModifiedDate: Date | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  Name: string | null;

  @Column({ type: "tinyint", nullable: true })
  Enabled: number | null;

  @Column({ type: "nvarchar", length: 6, nullable: true })
  Code: string | null;

  @Column({ type: "int", nullable: true })
  ParentId: number | null;
}
