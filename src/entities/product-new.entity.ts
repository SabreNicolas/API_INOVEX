import { ApiHideProperty } from "@nestjs/swagger";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { ElementControle } from "./element-controle.entity";

@Entity("products_new")
export class ProductNew {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ type: "datetime2", nullable: true })
  CreateDate: Date | null;

  @Column({ type: "datetime2", nullable: true })
  LastModifiedDate: Date | null;

  @Column({ type: "nvarchar", length: 700, nullable: true })
  Name: string | null;

  @Column({ type: "nvarchar", length: 15, nullable: true })
  Unit: string | null;

  @Column({ type: "tinyint", nullable: true })
  Enabled: number | null;

  @Column({ type: "nvarchar", length: 15, nullable: true })
  Code: string | null;

  @Column({ type: "int", nullable: true })
  typeId: number | null;

  @Column({ type: "int", nullable: true })
  idUsine: number | null;

  @Column({ length: 50, default: "" })
  TAG: string;

  @Column({ length: 100, default: "" })
  CodeEquipement: string;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  typeRecupEMonitoring: string | null;

  @Column({ type: "int", nullable: true })
  idElementRondier: number | null;

  @ApiHideProperty()
  @ManyToOne(() => ElementControle, { nullable: true })
  @JoinColumn({ name: "idElementRondier" })
  elementRondier: ElementControle | null;

  @Column({ type: "nvarchar", length: 30, nullable: true, default: "1" })
  Coefficient: string | null;

  @Column({ length: 15, default: "AnalogSummary" })
  typeDonneeEMonitoring: string;

  @Column({ length: 50, default: "aucune" })
  typeAlerte: string;

  @Column({ type: "int", nullable: true })
  valeurAlerte: number | null;

  @Column({ type: "tinyint", default: 0 })
  alerteActive: number;
}
