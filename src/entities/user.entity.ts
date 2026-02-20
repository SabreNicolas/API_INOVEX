import { Exclude } from "class-transformer";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("user")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nom: string;

  @Column({ length: 100 })
  prenom: string;

  @Column({ length: 100, unique: true })
  login: string;

  @Exclude()
  @Column({ length: 255 })
  pwd: string;

  @Column({ type: "bit", default: 0 })
  isEditeur: boolean;

  @Column({ type: "bit", default: 0 })
  isLecteur: boolean;

  @Column({ type: "bit", default: 0 })
  isAdmin: boolean;

  @Column({ type: "bit", default: 0 })
  isVeto: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @DeleteDateColumn({ name: "deleted_at" })
  deletedAt: Date | null;
}
