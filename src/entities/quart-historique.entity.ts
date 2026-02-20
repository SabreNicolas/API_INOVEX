import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_historique")
export class QuartHistorique {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idUser: number;

  @Column({ type: "datetime" })
  dateHeure: Date;

  @Column({ type: "int", nullable: true })
  idConsigne: number | null;

  @Column({ type: "int", nullable: true })
  idEvenement: number | null;

  @Column({ type: "int", nullable: true })
  idActu: number | null;

  @Column({ type: "int", nullable: true })
  priseQuart: number | null;

  @Column({ type: "int", nullable: true })
  finQuart: number | null;

  @Column({ type: "int", nullable: true })
  creation: number | null;

  @Column({ type: "int", nullable: true })
  edition: number | null;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "int", nullable: true })
  suppression: number | null;
}
