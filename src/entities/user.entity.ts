import { Exclude } from "class-transformer";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ name: "Id" })
  id: number;

  @Column({ name: "Nom", length: 255 })
  nom: string;

  @Column({ name: "Prenom", length: 255 })
  prenom: string;

  @Column({ length: 255, unique: true })
  login: string;

  @Column({ length: 100, default: "" })
  email: string;

  @Column({ length: 100, default: "" })
  loginGMAO: string;

  @Column({ length: 100, default: "" })
  posteUser: string;

  @Exclude()
  @Column({ length: 255 })
  pwd: string;

  @Column({ type: "bit" })
  isRondier: boolean;

  @Column({ type: "bit" })
  isSaisie: boolean;

  @Column({ type: "bit" })
  isQSE: boolean;

  @Column({ type: "bit" })
  isRapport: boolean;

  @Column({ type: "bit" })
  isAdmin: boolean;

  @Column({ type: "bit", default: false })
  isChefQuart: boolean;

  @Column({ type: "bit", default: false })
  isSuperAdmin: boolean;

  @Column({ type: "bit", default: false })
  isMail: boolean;

  @Column({ type: "bit", default: true })
  isActif: boolean;

  @Column({ type: "int", default: 1 })
  idUsine: number;
}
