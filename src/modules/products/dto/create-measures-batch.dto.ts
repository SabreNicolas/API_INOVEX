import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";

export class MeasureBatchItemDto {
  @ApiProperty({
    example: "2026-02-21",
    description: "Date de la mesure",
  })
  @IsNotEmpty({ message: "La date de la mesure est requise" })
  @Type(() => Date)
  @IsDate({ message: "La date doit être une date valide" })
  EntryDate: Date;

  @ApiProperty({
    example: 4040,
    description: "Valeur de la mesure",
  })
  @IsNotEmpty({ message: "La valeur est requise" })
  @IsNumber({}, { message: "La valeur doit être un nombre" })
  Value: number;

  @ApiProperty({
    example: 51726,
    description: "ID du produit",
  })
  @IsNotEmpty({ message: "L'ID du produit est requis" })
  @IsInt({ message: "L'ID du produit doit être un entier" })
  ProductId: number;

  @ApiPropertyOptional({
    example: 5850,
    description: "ID du producteur (optionnel)",
  })
  @IsOptional()
  @IsInt({ message: "L'ID du producteur doit être un entier" })
  ProducerId?: number;
}

export class CreateMeasuresBatchDto {
  @ApiProperty({
    type: [MeasureBatchItemDto],
    description: "Liste des mesures à créer",
  })
  @IsArray({ message: "Les mesures doivent être un tableau" })
  @ArrayMinSize(1, { message: "Au moins une mesure est requise" })
  @ValidateNested({ each: true })
  @Type(() => MeasureBatchItemDto)
  measures: MeasureBatchItemDto[];
}
