import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length, Matches } from "class-validator";

export class CreateValidationDonneeDto {
  @ApiProperty({
    example: "03",
    description: "Mois de validation (01-12)",
  })
  @IsNotEmpty({ message: "Le mois de validation est requis" })
  @IsString()
  @Length(2, 2, { message: "Le mois doit être sur 2 caractères (ex: 01, 12)" })
  @Matches(/^(0[1-9]|1[0-2])$/, {
    message: "Le mois doit être compris entre 01 et 12",
  })
  moisValidation: string;

  @ApiProperty({
    example: "2026",
    description: "Année de validation",
  })
  @IsNotEmpty({ message: "L'année de validation est requise" })
  @IsString()
  @Length(4, 4, { message: "L'année doit être sur 4 caractères" })
  @Matches(/^\d{4}$/, { message: "L'année doit être un nombre à 4 chiffres" })
  anneeValidation: string;
}
