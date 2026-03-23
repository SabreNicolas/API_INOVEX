import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, Max, Min } from "class-validator";

export class CreateRepriseRondeDto {
  @ApiProperty({
    description: "Date de la reprise de ronde (format YYYY-MM-DD)",
    example: "2026-03-23",
  })
  @IsDateString({}, { message: "La date doit être au format ISO (YYYY-MM-DD)" })
  date: string;

  @ApiProperty({
    description: "Numéro du quart (1 = matin, 2 = après-midi, 3 = nuit)",
    example: 1,
    minimum: 1,
    maximum: 3,
  })
  @Type(() => Number)
  @IsInt({ message: "Le quart doit être un entier" })
  @Min(1, { message: "Le quart doit être au minimum 1" })
  @Max(3, { message: "Le quart doit être au maximum 3" })
  quart: number;
}
