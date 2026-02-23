import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateSiteDto {
  @ApiProperty({
    example: "Paris",
    description: "Localisation du site",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "La localisation est requise" })
  @MaxLength(50, {
    message: "La localisation ne peut pas dépasser 50 caractères",
  })
  localisation: string;

  @ApiProperty({
    example: "USN01",
    description: "Code usine du site",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le code usine est requis" })
  @MaxLength(50, {
    message: "Le code usine ne peut pas dépasser 50 caractères",
  })
  codeUsine: string;

  @ApiPropertyOptional({
    example: 2,
    description: "Nombre de lignes",
  })
  @IsOptional()
  @IsInt({ message: "Le nombre de lignes doit être un entier" })
  @Min(0)
  nbLigne?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: "Nombre de GTA",
  })
  @IsOptional()
  @IsInt({ message: "Le nombre de GTA doit être un entier" })
  @Min(0)
  nbGTA?: number | null;

  @ApiPropertyOptional({
    example: 1,
    description: "Nombre de réseaux de chaleur",
  })
  @IsOptional()
  @IsInt({ message: "Le nombre de réseaux de chaleur doit être un entier" })
  @Min(0)
  nbReseauChaleur?: number | null;

  @ApiPropertyOptional({
    example: "AVEVA",
    description: "Type d'import",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "Le type d'import ne peut pas dépasser 50 caractères",
  })
  typeImport?: string | null;

  @ApiPropertyOptional({
    example: "A",
    description: "Type de rondier",
    maxLength: 3,
    default: "A",
  })
  @IsOptional()
  @IsString()
  @MaxLength(3, {
    message: "Le type de rondier ne peut pas dépasser 3 caractères",
  })
  typeRondier?: string;

  @ApiPropertyOptional({
    example: "192.168.1.1",
    description: "Adresse IP Aveva",
    maxLength: 30,
    default: "",
  })
  @IsOptional()
  @IsString()
  @MaxLength(30, {
    message: "L'adresse IP Aveva ne peut pas dépasser 30 caractères",
  })
  ipAveva?: string;

  @ApiPropertyOptional({
    example: 0,
    description: "Validation des données (0 ou 1)",
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1)
  validationDonnees?: number;

  @ApiPropertyOptional({
    example: "05:00",
    description: "Début du quart du matin (format HH:mm)",
    default: "05:00",
  })
  @IsOptional()
  @IsString()
  debutQuartMatin?: string | null;

  @ApiPropertyOptional({
    example: "13:00",
    description: "Fin du quart du matin (format HH:mm)",
    default: "13:00",
  })
  @IsOptional()
  @IsString()
  finQuartMatin?: string | null;

  @ApiPropertyOptional({
    example: "13:00",
    description: "Début du quart de l'après-midi (format HH:mm)",
    default: "13:00",
  })
  @IsOptional()
  @IsString()
  debutQuartAM?: string | null;

  @ApiPropertyOptional({
    example: "21:00",
    description: "Fin du quart de l'après-midi (format HH:mm)",
    default: "21:00",
  })
  @IsOptional()
  @IsString()
  finQuartAM?: string | null;

  @ApiPropertyOptional({
    example: "21:00",
    description: "Début du quart de nuit (format HH:mm)",
    default: "21:00",
  })
  @IsOptional()
  @IsString()
  debutQuartNuit?: string | null;

  @ApiPropertyOptional({
    example: "05:00",
    description: "Fin du quart de nuit (format HH:mm)",
    default: "05:00",
  })
  @IsOptional()
  @IsString()
  finQuartNuit?: string | null;

  @ApiPropertyOptional({
    example: 2,
    description: "Marge en heures pour les quarts",
    default: 2,
  })
  @IsOptional()
  @IsInt({ message: "La marge en heures doit être un entier" })
  @Min(0)
  margeHeuresQuart?: number;
}
