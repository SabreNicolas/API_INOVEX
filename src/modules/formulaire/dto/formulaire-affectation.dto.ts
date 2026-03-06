import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength } from "class-validator";

export class FormulaireAffectationDto {
  @ApiProperty({
    example: 1,
    description: "ID du produit",
  })
  @IsInt({ message: "L'ID du produit doit être un entier" })
  @IsNotEmpty({ message: "L'ID du produit est requis" })
  idProduct: number;

  @ApiProperty({
    example: "Alias du produit",
    description: "Alias du produit pour ce formulaire",
  })
  @IsString()
  @IsNotEmpty({ message: "L'alias est requis" })
  @MaxLength(200, { message: "L'alias ne peut pas dépasser 200 caractères" })
  alias: string;
}
