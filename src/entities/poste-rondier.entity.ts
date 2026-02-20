import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("postesRondier")
export class PosteRondier {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  nom: string;
}
