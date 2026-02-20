import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("groupement")
export class Groupement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  groupement: string;

  @Column({ type: "int" })
  zoneId: number;
}
