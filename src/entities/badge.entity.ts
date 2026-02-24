import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";
import { ZoneControle } from "./zone-controle.entity";

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

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId", referencedColumnName: "Id" })
  user: User;

  @ManyToOne(() => ZoneControle)
  @JoinColumn({ name: "zoneId", referencedColumnName: "Id" })
  zone: ZoneControle;
}
