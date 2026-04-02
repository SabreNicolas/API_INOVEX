import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateImportTonnageParametreDto {
  @ApiProperty({
    example: ";",
    description: "Délimiteur du fichier d'import",
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty({ message: "Le délimiteur est requis" })
  @MaxLength(2, {
    message: "Le délimiteur ne peut pas dépasser 2 caractères",
  })
  delimiter: string;

  @ApiProperty({
    example: true,
    description: "Indique si le fichier contient un en-tête",
  })
  @IsBoolean({ message: "Le champ header doit être un booléen" })
  header: boolean;

  @ApiProperty({
    example: 1,
    description: "Numéro de colonne du client",
  })
  @IsInt({ message: "Le champ client doit être un entier" })
  @Min(0, { message: "Le champ client doit être supérieur ou égal à 0" })
  client: number;

  @ApiProperty({
    example: 2,
    description: "Numéro de colonne du type de déchet",
  })
  @IsInt({ message: "Le champ typeDechet doit être un entier" })
  @Min(0, { message: "Le champ typeDechet doit être supérieur ou égal à 0" })
  typeDechet: number;

  @ApiProperty({
    example: 3,
    description: "Numéro de colonne de la date d'entrée",
  })
  @IsInt({ message: "Le champ dateEntree doit être un entier" })
  @Min(0, { message: "Le champ dateEntree doit être supérieur ou égal à 0" })
  dateEntree: number;

  @ApiProperty({
    example: 4,
    description: "Numéro de colonne du tonnage",
  })
  @IsInt({ message: "Le champ tonnage doit être un entier" })
  @Min(0, { message: "Le champ tonnage doit être supérieur ou égal à 0" })
  tonnage: number;

  @ApiPropertyOptional({
    example: 5,
    description: "Numéro de colonne entrée/sortie",
  })
  @IsOptional()
  @IsInt({ message: "Le champ entreeSortie doit être un entier" })
  @Min(0, {
    message: "Le champ entreeSortie doit être supérieur ou égal à 0",
  })
  entreeSortie?: number;

  @ApiPropertyOptional({
    example: "dd/MM/yyyy",
    description: "Format de date utilisé dans le fichier d'import",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "Le format de date ne peut pas dépasser 50 caractères",
  })
  dateFormat?: string;

  @ApiProperty({
    example: false,
    description: "Ignorer les lignes vides du fichier d'import",
  })
  @IsBoolean({ message: "Le champ skipEmptyRows doit être un booléen" })
  skipEmptyRows: boolean;

  @ApiProperty({
    example: false,
    description: "Supprimer toutes les mesures existantes avant import",
  })
  @IsBoolean({ message: "Le champ deleteAll doit être un booléen" })
  deleteAll: boolean;

  @ApiPropertyOptional({
    example: "kg",
    description: "Unité de poids",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "Le poids ne peut pas dépasser 50 caractères",
  })
  poids?: string;
}
