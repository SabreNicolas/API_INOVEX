import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("conversion")
export class Conversion {
  @PrimaryColumn({ length: 10 })
  uniteBase: string;

  @PrimaryColumn({ length: 10 })
  uniteCible: string;

  @Column({ length: 50 })
  conversion: string;
}
