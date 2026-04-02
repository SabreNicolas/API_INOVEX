import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: "Produit A",
    description: "Nom du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(700, { message: "Le nom ne peut pas dépasser 700 caractères" })
  Name?: string;

  @ApiPropertyOptional({
    example: "kg",
    description: "Unité du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: "L'unité ne peut pas dépasser 15 caractères" })
  Unit?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Statut activé (0 ou 1)",
  })
  @IsOptional()
  @IsInt({ message: "Enabled doit être un entier" })
  Enabled?: number;

  @ApiPropertyOptional({
    example: "PROD001",
    description: "Code du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(15, { message: "Le code ne peut pas dépasser 15 caractères" })
  Code?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Type du produit",
  })
  @IsOptional()
  @IsInt({ message: "Le type doit être un entier" })
  typeId?: number;

  @ApiPropertyOptional({
    example: "TAG001",
    description: "TAG du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Le TAG ne peut pas dépasser 50 caractères" })
  TAG?: string;

  @ApiPropertyOptional({
    example: "EQ001",
    description: "Code équipement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "Le code équipement ne peut pas dépasser 100 caractères",
  })
  CodeEquipement?: string;

  @ApiPropertyOptional({
    example: "ANALOG",
    description: "Type de récupération e-monitoring",
  })
  @IsOptional()
  @IsString()
  @MaxLength(10, {
    message:
      "Le type de récupération e-monitoring ne peut pas dépasser 10 caractères",
  })
  typeRecupEMonitoring?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'élément rondier associé (null pour dissocier)",
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt({ message: "L'ID élément rondier doit être un entier" })
  idElementRondier?: number | null;

  @ApiPropertyOptional({
    example: "1",
    description: "Coefficient du produit",
  })
  @IsOptional()
  @IsString()
  @MaxLength(30, {
    message: "Le coefficient ne peut pas dépasser 30 caractères",
  })
  Coefficient?: string;

  @ApiPropertyOptional({
    example: "AnalogSummary",
    description: "Type de donnée e-monitoring",
  })
  @IsOptional()
  @IsString()
  @MaxLength(15, {
    message:
      "Le type de donnée e-monitoring ne peut pas dépasser 15 caractères",
  })
  typeDonneeEMonitoring?: string;

  @ApiPropertyOptional({
    example: "aucune",
    description: "Type d'alerte",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "Le type d'alerte ne peut pas dépasser 50 caractères",
  })
  typeAlerte?: string;

  @ApiPropertyOptional({
    example: 100,
    description: "Valeur d'alerte",
  })
  @IsOptional()
  @IsInt({ message: "La valeur d'alerte doit être un entier" })
  valeurAlerte?: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Alerte active (0 ou 1)",
  })
  @IsOptional()
  @IsInt({ message: "alerteActive doit être un entier" })
  alerteActive?: number;
}
