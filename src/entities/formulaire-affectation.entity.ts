import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("formulaire_affectation")
export class FormulaireAffectation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idFormulaire: number;

  @Column({ type: "int" })
  idProduct: number;

  @Column({ length: 200 })
  alias: string;
}
