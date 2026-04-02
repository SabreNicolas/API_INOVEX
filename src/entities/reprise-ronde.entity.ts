import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("repriseRonde")
export class RepriseRonde {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "date" })
  date: string;

  @Column({ type: "int" })
  quart: number;

  @Column({ type: "int" })
  idUsine: number;

  @Column({ type: "int" })
  termine: number;
}
