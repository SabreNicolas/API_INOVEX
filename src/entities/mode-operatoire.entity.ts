import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("modeoperatoire")
export class ModeOperatoire {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  nom: string | null;

  @Column({ type: "int", nullable: true })
  zoneId: number | null;

  @Column({ length: 255 })
  fichier: string;
}
