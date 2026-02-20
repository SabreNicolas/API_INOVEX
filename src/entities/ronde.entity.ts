import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("ronde")
export class Ronde {
  @PrimaryGeneratedColumn()
  Id: number;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  dateHeure: string | null;

  @Column({ type: "int", nullable: true })
  quart: number | null;

  @Column({ type: "int", nullable: true })
  userId: number | null;

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

  @Column({ type: "int", default: 1 })
  idUsine: number;

  @Column({ length: 255, default: "" })
  urlPDF: string;

  @Column({ type: "datetime" })
  dateHeureCreation: Date;
}
