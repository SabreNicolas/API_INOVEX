import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("actions_enregistrement")
export class ActionEnregistrement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  nom: string;

  @Column({ type: "int" })
  idUsine: number;
}
