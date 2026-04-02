import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { User } from "./user.entity";

@Entity("ronde")
export class Ronde {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  dateHeure: string | null;

  @Column({ type: "int", nullable: true })
  quart: number | null;

  @Column({ type: "int", nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  commentaire: string | null;

  @Column({ type: "bit", nullable: true, default: false })
  isFinished: boolean | null;

  @Column({ type: "bit", nullable: true, default: false })
  fonctFour1: boolean | null;

  @Column({ type: "bit", nullable: true, default: false })
  fonctFour2: boolean | null;

  @Column({ type: "bit", nullable: true, default: false })
  fonctFour3: boolean | null;

  @Column({ type: "bit", nullable: true, default: false })
  fonctFour4: boolean | null;

  @Column({ type: "int", nullable: true })
  chefQuartId: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "chefQuartId" })
  chefQuart: User | null;

  @Column({ type: "int", default: 1 })
  idUsine: number;

  @Column({ length: 255, default: "" })
  urlPDF: string;

  @Column({ type: "datetime" })
  dateHeureCreation: Date;
}
