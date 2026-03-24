import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("token")
export class Token {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ length: 255 })
  token: string;

  @Column({ length: 255 })
  affectation: string;

  @Column({ name: "Enabled", type: "bit", default: true })
  enabled: boolean;
}
