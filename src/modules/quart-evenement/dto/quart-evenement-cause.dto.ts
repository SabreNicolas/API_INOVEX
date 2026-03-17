import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateQuartEvenementCauseDto {
  @ApiProperty({
    example: "Usure",
    description: "Cause de l'événement",
  })
  @IsString()
  @IsNotEmpty({ message: "La cause est requise" })
  @MaxLength(50, { message: "La cause ne peut pas dépasser 50 caractères" })
  cause: string;

  @ApiProperty({
    example: "GMAO-001",
    description: "Valeur GMAO associée",
  })
  @IsString()
  @IsNotEmpty({ message: "La valeur GMAO est requise" })
  @MaxLength(50, {
    message: "La valeur GMAO ne peut pas dépasser 50 caractères",
  })
  valueGmao: string;
}

export class UpdateQuartEvenementCauseDto {
  @ApiPropertyOptional({
    example: "Usure modifiée",
    description: "Cause de l'événement",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "La cause ne peut pas dépasser 50 caractères" })
  cause?: string;

  @ApiPropertyOptional({
    example: "GMAO-002",
    description: "Valeur GMAO associée",
  })
  @IsOptional()
  @IsString()
  @MaxLength(50, {
    message: "La valeur GMAO ne peut pas dépasser 50 caractères",
  })
  valueGmao?: string;
}
