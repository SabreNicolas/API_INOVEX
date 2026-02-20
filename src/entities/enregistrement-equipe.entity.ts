import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("enregistrement_equipe")
export class EnregistrementEquipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  equipe: string;
}
