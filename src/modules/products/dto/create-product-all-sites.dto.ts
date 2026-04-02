import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateProductAllSitesDto {
  @ApiProperty({
    example: "Produit A",
    description: "Nom du produit",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom du produit est requis" })
  @MaxLength(700, { message: "Le nom ne peut pas dépasser 700 caractères" })
  Name: string;

  @ApiPropertyOptional({
    example: "kg",
    description: "Unité du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: "L'unité ne peut pas dépasser 15 caractères" })
  Unit?: string;

  @ApiProperty({
    example: "50101",
    description: "Code du produit",
  })
  @IsString()
  @IsNotEmpty({ message: "Le code du produit est requis" })
  @MaxLength(15, { message: "Le code ne peut pas dépasser 15 caractères" })
  Code: string;

  @ApiProperty({
    example: 5,
    description:
      "Type du produit (4=Compteur, 5=Sortant, 6=Analyse, 2=Consommable)",
  })
  @IsInt({ message: "Le type doit être un entier" })
  @IsNotEmpty({ message: "Le type est requis" })
  typeId: number;

  @ApiPropertyOptional({
    example: "TAG001",
    description: "TAG du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Le TAG ne peut pas dépasser 50 caractères" })
  TAG?: string;

  @ApiProperty({
    example: 10,
    description: "ID de la catégorie à associer",
  })
  @IsInt({ message: "L'ID catégorie doit être un entier" })
  @IsNotEmpty({ message: "L'ID catégorie est requis" })
  categoryId: number;
}
