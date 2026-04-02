import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePosteRondierDto {
  @ApiProperty({
    example: "Poste 1",
    description: "Nom du poste rondier",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom du poste rondier est requis" })
  @MaxLength(50, {
    message: "Le nom du poste rondier ne peut pas dépasser 50 caractères",
  })
  nom: string;
}
