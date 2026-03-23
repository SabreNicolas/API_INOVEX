import { ApiProperty, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateChoixDepassementProduitDto {
  @ApiProperty({
    description: "Nom du choix de dépassement produit",
    maxLength: 50,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nom?: string | null;
}

export class UpdateChoixDepassementProduitDto extends PartialType(
  CreateChoixDepassementProduitDto
) {}
