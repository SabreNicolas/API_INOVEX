import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateElementControleDto {
  @ApiProperty({
    example: "Température four",
    description: "Nom de l'élément de contrôle",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  nom: string;

  @ApiProperty({
    example: 1,
    description: "ID de la zone associée",
  })
  @IsInt({ message: "L'ID de zone doit être un entier" })
  @IsNotEmpty({ message: "L'ID de zone est requis" })
  zoneId: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Valeur minimale",
  })
  @IsOptional()
  @IsNumber({}, { message: "La valeur minimale doit être un nombre" })
  valeurMin?: number;

  @ApiPropertyOptional({
    example: 100,
    description: "Valeur maximale",
  })
  @IsOptional()
  @IsNumber({}, { message: "La valeur maximale doit être un nombre" })
  valeurMax?: number;

  @ApiPropertyOptional({
    example: "number",
    description: "Type de champ (number, text, select, etc.)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, {
    message: "Le type de champ ne peut pas dépasser 45 caractères",
  })
  typeChamp?: string;

  @ApiPropertyOptional({
    example: "°C",
    description: "Unité de mesure",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: "L'unité ne peut pas dépasser 45 caractères" })
  unit?: string;

  @ApiPropertyOptional({
    example: "25",
    description: "Valeur par défaut",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, {
    message: "La valeur par défaut ne peut pas dépasser 45 caractères",
  })
  defaultValue?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Est un régulateur",
  })
  @IsOptional()
  @IsBoolean({ message: "isRegulateur doit être un booléen" })
  isRegulateur?: boolean;

  @ApiPropertyOptional({
    example: "option1,option2,option3",
    description: "Liste des valeurs possibles (pour les champs select)",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "La liste des valeurs ne peut pas dépasser 200 caractères",
  })
  listValues?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Est un compteur",
  })
  @IsOptional()
  @IsBoolean({ message: "isCompteur doit être un booléen" })
  isCompteur?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: "Ordre d'affichage",
  })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  ordre?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID du groupement associé",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du groupement doit être un entier" })
  idGroupement?: number;

  @ApiPropertyOptional({
    example: "EQ-001",
    description: "Code équipement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Le code équipement ne peut pas dépasser 100 caractères",
  })
  CodeEquipement?: string;

  @ApiPropertyOptional({
    example: "Information supplémentaire",
    description: "Informations supplémentaires",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "Les infos supplémentaires ne peuvent pas dépasser 200 caractères",
  })
  infoSup?: string;
}

export class UpdateElementControleDto {
  @ApiPropertyOptional({
    example: "Température four modifié",
    description: "Nom de l'élément de contrôle",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: "Le nom ne peut pas dépasser 255 caractères" })
  nom?: string;

  @ApiPropertyOptional({
    example: 2,
    description: "ID de la zone associée",
  })
  @IsOptional()
  @IsInt({ message: "L'ID de zone doit être un entier" })
  zoneId?: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Valeur minimale",
  })
  @IsOptional()
  @IsNumber({}, { message: "La valeur minimale doit être un nombre" })
  valeurMin?: number;

  @ApiPropertyOptional({
    example: 100,
    description: "Valeur maximale",
  })
  @IsOptional()
  @IsNumber({}, { message: "La valeur maximale doit être un nombre" })
  valeurMax?: number;

  @ApiPropertyOptional({
    example: "number",
    description: "Type de champ",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, {
    message: "Le type de champ ne peut pas dépasser 45 caractères",
  })
  typeChamp?: string;

  @ApiPropertyOptional({
    example: "°C",
    description: "Unité de mesure",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, { message: "L'unité ne peut pas dépasser 45 caractères" })
  unit?: string;

  @ApiPropertyOptional({
    example: "25",
    description: "Valeur par défaut",
  })
  @IsOptional()
  @IsString()
  @MaxLength(45, {
    message: "La valeur par défaut ne peut pas dépasser 45 caractères",
  })
  defaultValue?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Est un régulateur",
  })
  @IsOptional()
  @IsBoolean({ message: "isRegulateur doit être un booléen" })
  isRegulateur?: boolean;

  @ApiPropertyOptional({
    example: "option1,option2,option3",
    description: "Liste des valeurs possibles",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "La liste des valeurs ne peut pas dépasser 200 caractères",
  })
  listValues?: string;

  @ApiPropertyOptional({
    example: false,
    description: "Est un compteur",
  })
  @IsOptional()
  @IsBoolean({ message: "isCompteur doit être un booléen" })
  isCompteur?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: "Ordre d'affichage",
  })
  @IsOptional()
  @IsInt({ message: "L'ordre doit être un entier" })
  ordre?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID du groupement associé",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du groupement doit être un entier" })
  idGroupement?: number;

  @ApiPropertyOptional({
    example: "EQ-001",
    description: "Code équipement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Le code équipement ne peut pas dépasser 100 caractères",
  })
  CodeEquipement?: string;

  @ApiPropertyOptional({
    example: "Information supplémentaire",
    description: "Informations supplémentaires",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, {
    message: "Les infos supplémentaires ne peuvent pas dépasser 200 caractères",
  })
  infoSup?: string;
}
