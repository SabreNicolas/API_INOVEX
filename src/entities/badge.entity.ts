import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("badge")
export class Badge {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "bit", nullable: true, default: true })
  isEnabled: boolean | null;

  @Column({ type: "int", nullable: true })
  userId: number | null;

  @Column({ type: "int", nullable: true })
  zoneId: number | null;

  @Column({ type: "nvarchar", length: 20, nullable: true, unique: true })
  uid: string | null;

  @Column({ type: "int", default: 1 })
  idUsine: number;
}
