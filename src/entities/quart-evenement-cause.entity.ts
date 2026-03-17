import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("quart_evenement_cause")
export class QuartEvenementCause {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "nvarchar", length: 50 })
  cause: string;

  @Column({ type: "nvarchar", length: 50, name: "valueGMAO" })
  valueGmao: string;
}
