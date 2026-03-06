import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from "class-validator";

import { FormulaireAffectationDto } from "./formulaire-affectation.dto";

export class CreateFormulaireDto {
  @ApiProperty({
    example: "Formulaire Production",
    description: "Nom du formulaire",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom du formulaire est requis" })
  @MaxLength(100, {
    message: "Le nom du formulaire ne peut pas dépasser 100 caractères",
  })
  nom: string;

  @ApiPropertyOptional({
    type: [FormulaireAffectationDto],
    description: "Liste des produits associés au formulaire",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormulaireAffectationDto)
  produits?: FormulaireAffectationDto[];
}
