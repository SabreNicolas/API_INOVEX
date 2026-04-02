import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_action")
export class QuartAction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 1000 })
  nom: string;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "datetime" })
  date_heure_debut: Date;

  @Column({ type: "datetime" })
  date_heure_fin: Date;
}
