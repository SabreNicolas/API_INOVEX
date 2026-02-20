import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("depassements")
export class Depassement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "datetime", nullable: true })
  date_heure_debut: Date | null;

  @Column({ type: "datetime", nullable: true })
  date_heure_fin: Date | null;

  @Column({ type: "decimal", precision: 18, scale: 3, nullable: true })
  duree: number | null;

  @Column({ type: "int", nullable: true })
  user: number | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  description: string | null;

  @Column({ type: "datetime", nullable: true })
  date_saisie: Date | null;

  @Column({ type: "int", nullable: true })
  productId: number | null;
}
