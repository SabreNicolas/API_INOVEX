import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("token")
export class Token {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ length: 255 })
  token: string;

  @Column({ length: 255 })
  affectation: string;

  @Column({ type: "bit", default: true })
  Enabled: boolean;
}
