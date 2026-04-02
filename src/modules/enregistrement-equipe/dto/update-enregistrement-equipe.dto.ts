import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
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

export class UpdateEnregistrementEquipeDto {
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
