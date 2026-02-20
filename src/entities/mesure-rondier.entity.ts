import { Column, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity("mesuresrondier")
@Unique(["elementId", "rondeId"])
export class MesureRondier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  elementId: number | null;

  @Column({ type: "nvarchar", length: 25, nullable: true })
  modeRegulateur: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  value: string | null;

  @Column({ type: "int", nullable: true })
  rondeId: number | null;

  @Column({ type: "datetime" })
  dateHeure: Date;
}
