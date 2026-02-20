import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("enregistrement_affectation_equipe")
export class EnregistrementAffectationEquipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "int" })
  idRondier: number;

  @Column({ type: "int" })
  idEquipe: number;

  @Column({ length: 100, default: "" })
  poste: string;
}
