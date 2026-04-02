import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
} from "class-validator";

export class CreateMeasureDto {
  @ApiProperty({
    example: "2026-03-04T08:00:00.000Z",
    description: "Date de la mesure",
  })
  @IsNotEmpty({ message: "La date de la mesure est requise" })
  @Type(() => Date)
  @IsDate({ message: "La date doit être une date valide" })
  EntryDate: Date;

  @ApiProperty({
    example: 42.5,
    description: "Valeur de la mesure",
  })
  @IsNotEmpty({ message: "La valeur est requise" })
  @IsNumber({}, { message: "La valeur doit être un nombre" })
  Value: number;

  @ApiProperty({
    example: 1,
    description: "ID du produit associé",
  })
  @IsNotEmpty({ message: "L'ID du produit est requis" })
  @IsInt({ message: "L'ID du produit doit être un entier" })
  ProductId: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID du producteur (utilisateur)",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du producteur doit être un entier" })
  ProducerId?: number;
}
