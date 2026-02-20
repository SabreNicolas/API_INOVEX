import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("zonecontrole")
export class ZoneControle {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  nom: string | null;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  commentaire: string | null;

  @Column({ type: "int", default: 0 })
  four: number;

  @Column({ type: "int", default: 1 })
  idUsine: number;
}
