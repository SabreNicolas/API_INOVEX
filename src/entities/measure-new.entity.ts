import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("measures_new")
export class MeasureNew {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ type: "datetime2", nullable: true })
  CreateDate: Date | null;

  @Column({ type: "datetime2", nullable: true })
  LastModifiedDate: Date | null;

  @Column({ type: "datetime2", nullable: true })
  EntryDate: Date | null;

  @Column({ type: "decimal", precision: 18, scale: 4, nullable: true })
  Value: number | null;

  @Column({ type: "int", nullable: true })
  ProductId: number | null;

  @Column({ type: "int", nullable: true })
  ProducerId: number | null;
}
