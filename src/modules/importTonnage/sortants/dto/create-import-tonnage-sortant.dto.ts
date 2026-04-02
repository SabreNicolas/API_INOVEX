import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from "class-validator";

export class CreateImportTonnageSortantDto {
  @ApiProperty({
    example: 1,
    description: "ID du produit",
  })
  @IsInt({ message: "Le ProductId doit être un entier" })
  @Min(1, { message: "Le ProductId doit être supérieur à 0" })
  ProductId: number;

  @ApiProperty({
    example: 1,
    description: "ID de l'usine",
  })
  @IsInt({ message: "L'idUsine doit être un entier" })
  @Min(1, { message: "L'idUsine doit être supérieur à 0" })
  idUsine: number;

  @ApiProperty({
    example: "Sortant001",
    description: "Nom du produit importé",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom du produit importé est requis" })
  @MaxLength(255, {
    message: "Le nom du produit importé ne peut pas dépasser 255 caractères",
  })
  productImport: string;
}
