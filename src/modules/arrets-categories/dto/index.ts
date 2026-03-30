import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

// --- ArretCategorie ---

export class CreateArretCategorieDto {
  @ApiProperty({ example: "Mécanique", description: "Nom de la catégorie" })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(150, { message: "Le nom ne peut pas dépasser 150 caractères" })
  nom: string;
}

export class UpdateArretCategorieDto {
  @ApiPropertyOptional({
    example: "Électrique",
    description: "Nom de la catégorie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: "Le nom ne peut pas dépasser 150 caractères" })
  nom?: string;
}

// --- ArretSousCategorie ---

export class CreateArretSousCategorieDto {
  @ApiProperty({ example: "Moteur", description: "Nom de la sous-catégorie" })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(150, { message: "Le nom ne peut pas dépasser 150 caractères" })
  nom: string;
}

export class UpdateArretSousCategorieDto {
  @ApiPropertyOptional({
    example: "Pompe",
    description: "Nom de la sous-catégorie",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
  nom?: string;
}

// --- ArretArretCategorie (liaison produit <-> catégorie) ---

export class CreateArretArretCategorieDto {
  @ApiProperty({
    example: "Ligne 1",
    description: "Nom contient (filtre produit)",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nomContient est requis" })
  @MaxLength(50, {
    message: "Le nomContient ne peut pas dépasser 50 caractères",
  })
  nomContient: string;

  @ApiProperty({ example: 1, description: "Importance" })
  @IsInt({ message: "L'importance doit être un entier" })
  @IsNotEmpty({ message: "L'importance est requise" })
  importance: number;

  @ApiProperty({ example: 1, description: "ID de la catégorie d'arrêt" })
  @IsInt({ message: "L'ID de la catégorie doit être un entier" })
  @IsNotEmpty({ message: "L'ID de la catégorie est requis" })
  idArretsCategories: number;
}

// --- ArretCategorieSousCategorie (liaison catégorie <-> sous-catégorie) ---

export class CreateArretCategorieSousCategorieDto {
  @ApiProperty({ example: 1, description: "ID de la catégorie d'arrêt" })
  @IsInt({ message: "L'ID de la catégorie doit être un entier" })
  @IsNotEmpty({ message: "L'ID de la catégorie est requis" })
  idArretsCategories: number;

  @ApiProperty({ example: 1, description: "ID de la sous-catégorie d'arrêt" })
  @IsInt({ message: "L'ID de la sous-catégorie doit être un entier" })
  @IsNotEmpty({ message: "L'ID de la sous-catégorie est requis" })
  idArretsSousCategories: number;
}
