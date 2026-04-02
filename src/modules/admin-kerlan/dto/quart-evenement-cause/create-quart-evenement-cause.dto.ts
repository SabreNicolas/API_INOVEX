import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateQuartEvenementCauseDto {
  @ApiProperty({
    example: "Panne électrique",
    description: "Libellé de la cause",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "La cause est requise" })
  @MaxLength(50, { message: "La cause ne peut pas dépasser 50 caractères" })
  cause: string;

  @ApiProperty({
    example: "ELEC_FAIL",
    description: "Valeur pour la GMAO",
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty({ message: "La valeur GMAO est requise" })
  @MaxLength(50, {
    message: "La valeur GMAO ne peut pas dépasser 50 caractères",
  })
  valueGmao: string;
}
