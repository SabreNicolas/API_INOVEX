import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("equipe")
export class Equipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  equipe: string;

  @Column({ type: "int" })
  quart: number;

  @Column({ type: "int" })
  idChefQuart: number;

  @Column({ type: "date", nullable: true })
  date: string | null;
}
