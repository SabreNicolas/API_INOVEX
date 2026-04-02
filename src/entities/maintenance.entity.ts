import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("maintenance")
export class Maintenance {
  @PrimaryColumn({ type: "datetime2" })
  dateHeureDebut: Date;

  @Column({ type: "datetime2" })
  dateHeureFin: Date;
}
