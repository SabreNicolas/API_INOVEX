import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsInt, IsNotEmpty } from "class-validator";

export class CreateDepassementProduitDto {
  @ApiProperty({ description: "ID du choix de dépassement produit" })
  @IsNotEmpty()
  @IsInt()
  idChoixDepassementsProduits: number;

  @ApiProperty({ description: "ID du choix de dépassement" })
  @IsNotEmpty()
  @IsInt()
  idChoixDepassements: number;
}

export class UpdateDepassementProduitDto extends PartialType(
  CreateDepassementProduitDto
) {}
