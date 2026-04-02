import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateConsigneTypeDto {
  @ApiProperty({
    example: "Consigne de sécurité",
    description: "Nom du type de consigne",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(50, { message: "Le nom ne peut pas dépasser 50 caractères" })
  nom: string;
}
