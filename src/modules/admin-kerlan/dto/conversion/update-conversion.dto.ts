import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateConversionDto {
  @ApiPropertyOptional({
    example: "*1000",
    description: "Formule de conversion",
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "La conversion ne peut pas dépasser 50 caractères",
  })
  conversion?: string;
}
