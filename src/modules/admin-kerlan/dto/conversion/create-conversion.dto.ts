import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateConversionDto {
  @ApiProperty({
    example: "kg",
    description: "Unité de base",
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: "L'unité de base est requise" })
  @MaxLength(10, {
    message: "L'unité de base ne peut pas dépasser 10 caractères",
  })
  uniteBase: string;

  @ApiProperty({
    example: "t",
    description: "Unité cible",
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: "L'unité cible est requise" })
  @MaxLength(10, {
    message: "L'unité cible ne peut pas dépasser 10 caractères",
  })
  uniteCible: string;

  @ApiProperty({
    example: "/1000",
    description: "Formule de conversion",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "La conversion est requise" })
  @MaxLength(50, {
    message: "La conversion ne peut pas dépasser 50 caractères",
  })
  conversion: string;
}
