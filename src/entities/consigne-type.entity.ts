import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("consigneType")
export class ConsigneType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nom: string;
}
