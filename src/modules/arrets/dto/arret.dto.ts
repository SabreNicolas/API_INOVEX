import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateArretDto {
  @ApiProperty({
    example: "2026-03-06T08:00:00.000Z",
    description: "Date/heure de début de l'arrêt",
  })
  @IsDateString({}, { message: "La date de début doit être une date valide" })
  @IsNotEmpty({ message: "La date de début est requise" })
  date_heure_debut: string;

  @ApiProperty({
    example: "2026-03-06T10:00:00.000Z",
    description: "Date/heure de fin de l'arrêt",
  })
  @IsDateString({}, { message: "La date de fin doit être une date valide" })
  @IsNotEmpty({ message: "La date de fin est requise" })
  date_heure_fin: string;

  @ApiProperty({
    example: 2.5,
    description: "Durée de l'arrêt en heures",
  })
  @IsNumber({}, { message: "La durée doit être un nombre" })
  @IsNotEmpty({ message: "La durée est requise" })
  duree: number;

  @ApiPropertyOptional({
    example: "Panne mécanique",
    description: "Description de l'arrêt",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "La description ne peut pas dépasser 255 caractères",
  })
  description?: string;

  @ApiProperty({
    example: 1,
    description: "ID du produit concerné",
  })
  @IsInt({ message: "L'ID du produit doit être un entier" })
  @IsNotEmpty({ message: "L'ID du produit est requis" })
  productId: number;
}

export class UpdateArretDto {
  @ApiPropertyOptional({
    example: "2026-03-06T08:00:00.000Z",
    description: "Date/heure de début de l'arrêt",
  })
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide" })
  date_heure_debut?: string;

  @ApiPropertyOptional({
    example: "2026-03-06T10:00:00.000Z",
    description: "Date/heure de fin de l'arrêt",
  })
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide" })
  date_heure_fin?: string;

  @ApiPropertyOptional({
    example: 2.5,
    description: "Durée de l'arrêt en heures",
  })
  @IsOptional()
  @IsNumber({}, { message: "La durée doit être un nombre" })
  duree?: number;

  @ApiPropertyOptional({
    example: "Panne mécanique",
    description: "Description de l'arrêt",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "La description ne peut pas dépasser 255 caractères",
  })
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "ID du produit concerné",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du produit doit être un entier" })
  productId?: number;
}
