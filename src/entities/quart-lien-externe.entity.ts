import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_liensExternes")
export class QuartLienExterne {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  nom: string;

  @Column({ length: 250 })
  url: string;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "int" })
  actif: number;
}
