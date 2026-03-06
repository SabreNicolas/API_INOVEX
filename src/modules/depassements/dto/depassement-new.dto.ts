import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateDepassementNewDto {
  @ApiPropertyOptional({
    example: "Dépassement SO2",
    description: "Choix du type de dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  choixDepassements?: string;

  @ApiPropertyOptional({
    example: "Produit A",
    description: "Choix du produit de dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  choixDepassementsProduits?: string;

  @ApiPropertyOptional({
    example: "Ligne 1",
    description: "Ligne concernée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ligne?: string;

  @ApiProperty({
    example: "2026-03-06T08:00:00.000Z",
    description: "Date/heure de début du dépassement",
  })
  @IsDateString({}, { message: "La date de début doit être une date valide" })
  @IsNotEmpty({ message: "La date de début est requise" })
  date_heure_debut: string;

  @ApiProperty({
    example: "2026-03-06T10:00:00.000Z",
    description: "Date/heure de fin du dépassement",
  })
  @IsDateString({}, { message: "La date de fin doit être une date valide" })
  @IsNotEmpty({ message: "La date de fin est requise" })
  date_heure_fin: string;

  @ApiPropertyOptional({
    example: "Surcharge du four",
    description: "Causes du dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  causes?: string;

  @ApiPropertyOptional({
    example: "150 mg/Nm3",
    description: "Concentration mesurée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  concentration?: string;
}

export class UpdateDepassementNewDto {
  @ApiPropertyOptional({
    example: "Dépassement SO2",
    description: "Choix du type de dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  choixDepassements?: string;

  @ApiPropertyOptional({
    example: "Produit A",
    description: "Choix du produit de dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  choixDepassementsProduits?: string;

  @ApiPropertyOptional({
    example: "Ligne 1",
    description: "Ligne concernée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ligne?: string;

  @ApiPropertyOptional({
    example: "2026-03-06T08:00:00.000Z",
    description: "Date/heure de début du dépassement",
  })
  @IsOptional()
  @IsDateString({}, { message: "La date de début doit être une date valide" })
  date_heure_debut?: string;

  @ApiPropertyOptional({
    example: "2026-03-06T10:00:00.000Z",
    description: "Date/heure de fin du dépassement",
  })
  @IsOptional()
  @IsDateString({}, { message: "La date de fin doit être une date valide" })
  date_heure_fin?: string;

  @ApiPropertyOptional({
    example: "Surcharge du four",
    description: "Causes du dépassement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  causes?: string;

  @ApiPropertyOptional({
    example: "150 mg/Nm3",
    description: "Concentration mesurée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  concentration?: string;
}
