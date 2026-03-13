import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Ronde } from "./ronde.entity";
import { ZoneControle } from "./zone-controle.entity";

@Entity("anomalie")
export class Anomalie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  rondeId: number | null;

  @ManyToOne(() => Ronde, { nullable: true })
  @JoinColumn({ name: "rondeId" })
  ronde: Ronde | null;

  @Column({ type: "int", nullable: true })
  zoneId: number | null;

  @ManyToOne(() => ZoneControle, { nullable: true })
  @JoinColumn({ name: "zoneId" })
  zone: ZoneControle | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  commentaire: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  photo: string | null;

  @Column({ type: "int", default: 0 })
  evenement: number;
}
