import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("type_new")
export class TypeNew {
  @PrimaryGeneratedColumn({ name: "idType" })
  idType: number;

  @Column({ type: "nvarchar", length: 45, nullable: true })
  type: string | null;
}
