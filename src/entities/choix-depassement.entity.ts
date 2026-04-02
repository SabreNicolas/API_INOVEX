import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("choixDepassements")
export class ChoixDepassement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  nom: string;
}
