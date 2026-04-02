import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class UpdateAffectationEquipeDto {
  @ApiPropertyOptional({
    description: "ID de l'affectation (pour mise à jour)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  id?: number;

  @ApiPropertyOptional({ example: 1, description: "ID du rondier" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idRondier?: number;

  @ApiPropertyOptional({ example: 1, description: "ID de la zone" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idZone?: number;

  @ApiPropertyOptional({
    example: "Poste 1",
    description: "Nom du poste",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  poste?: string;

  @ApiPropertyOptional({
    example: "08:00",
    description: "Heure de début",
  })
  @IsOptional()
  @IsString()
  heure_deb?: string;

  @ApiPropertyOptional({
    example: "16:00",
    description: "Heure de fin",
  })
  @IsOptional()
  @IsString()
  heure_fin?: string;

  @ApiPropertyOptional({
    example: "00:30",
    description: "Temps de pause",
  })
  @IsOptional()
  @IsString()
  heure_tp?: string;

  @ApiPropertyOptional({
    example: "Pause déjeuner",
    description: "Commentaire temps de pause",
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  comm_tp?: string;
}

export class UpdateEquipeDto {
  @ApiPropertyOptional({
    example: "Équipe A",
    description: "Nom de l'équipe",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "Le nom de l'équipe ne peut pas dépasser 50 caractères",
  })
  equipe?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Numéro de quart (1=matin, 2=après-midi, 3=nuit)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quart?: number;

  @ApiPropertyOptional({ example: 1, description: "ID du chef de quart" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  idChefQuart?: number;

  @ApiPropertyOptional({
    example: "2026-03-20",
    description: "Date de l'équipe (format ISO)",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    type: [UpdateAffectationEquipeDto],
    description:
      "Affectations de l'équipe. Les affectations avec un ID sont mises à jour, sans ID sont créées. Les affectations existantes absentes de la liste sont supprimées.",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAffectationEquipeDto)
  affectations?: UpdateAffectationEquipeDto[];
}
