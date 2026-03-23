import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateAffectationEquipeDto {
  @ApiProperty({ example: 1, description: "ID du rondier" })
  @Type(() => Number)
  @IsInt()
  idRondier: number;

  @ApiProperty({ example: 1, description: "ID de la zone" })
  @Type(() => Number)
  @IsInt()
  idZone: number;

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

export class CreateEquipeDto {
  @ApiProperty({
    example: "Équipe A",
    description: "Nom de l'équipe",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom de l'équipe est requis" })
  @MaxLength(50, {
    message: "Le nom de l'équipe ne peut pas dépasser 50 caractères",
  })
  equipe: string;

  @ApiProperty({
    example: 1,
    description: "Numéro de quart (1=matin, 2=après-midi, 3=nuit)",
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quart: number;

  @ApiProperty({ example: 1, description: "ID du chef de quart" })
  @Type(() => Number)
  @IsInt()
  idChefQuart: number;

  @ApiPropertyOptional({
    example: "2026-03-20",
    description: "Date de l'équipe (format ISO)",
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    type: [CreateAffectationEquipeDto],
    description: "Affectations de l'équipe",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAffectationEquipeDto)
  affectations?: CreateAffectationEquipeDto[];
}
