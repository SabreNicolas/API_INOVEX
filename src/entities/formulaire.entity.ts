import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("formulaire")
export class Formulaire {
  @PrimaryGeneratedColumn({ name: "idFormulaire" })
  idFormulaire: number;

  @Column({ length: 100 })
  nom: string;

  @Column({ type: "int" })
  idUsine: number;
}
