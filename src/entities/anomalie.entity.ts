import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("anomalie")
export class Anomalie {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int", nullable: true })
  rondeId: number | null;

  @Column({ type: "int", nullable: true })
  zoneId: number | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  commentaire: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  photo: string | null;

  @Column({ type: "int", default: 0 })
  evenement: number;
}
