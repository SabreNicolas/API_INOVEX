import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

export class AffectationEquipeDto {
  @ApiProperty({ example: 1, description: "ID du rondier" })
  @Type(() => Number)
  @IsInt()
  idRondier: number;

  @ApiPropertyOptional({
    example: "Poste 1",
    description: "Nom du poste",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  poste?: string;
}

export class CreateEnregistrementEquipeDto {
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

  @ApiPropertyOptional({
    type: [AffectationEquipeDto],
    description: "Affectations de l'équipe",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AffectationEquipeDto)
  affectations?: AffectationEquipeDto[];
}
