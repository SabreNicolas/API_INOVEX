import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("validationDonnees")
export class ValidationDonnee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idUser: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "date" })
  date: string;

  @Column({ length: 2 })
  moisValidation: string;

  @Column({ length: 4 })
  anneeValidation: string;
}
