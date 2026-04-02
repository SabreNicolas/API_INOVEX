import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateMesureRondierDto {
  @ApiPropertyOptional({
    description: "Mode régulateur",
    example: "AUTO",
    maxLength: 25,
  })
  @IsOptional()
  @IsString({
    message: "Le mode régulateur doit être une chaîne de caractères",
  })
  @MaxLength(25, {
    message: "Le mode régulateur ne doit pas dépasser 25 caractères",
  })
  modeRegulateur?: string;

  @ApiPropertyOptional({
    description: "Valeur de la mesure",
    example: "42.5",
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "La valeur doit être une chaîne de caractères" })
  @MaxLength(255, { message: "La valeur ne doit pas dépasser 255 caractères" })
  value?: string;
}
