import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateMoralEntityDto {
  @ApiPropertyOptional({ description: "Nom de l'entité" })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  Name?: string;

  @ApiPropertyOptional({ description: "Adresse" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  Address?: string;

  @ApiPropertyOptional({ description: "Activé (0 ou 1)" })
  @IsOptional()
  @IsInt()
  Enabled?: number;

  @ApiPropertyOptional({ description: "Code" })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  Code?: string;

  @ApiPropertyOptional({ description: "Prix unitaire" })
  @IsOptional()
  @IsNumber()
  UnitPrice?: number;

  @ApiPropertyOptional({ description: "Numéro CAP" })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  numCAP?: string;

  @ApiPropertyOptional({ description: "Code déchet" })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  codeDechet?: string;

  @ApiPropertyOptional({ description: "Nom du client" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomClient?: string;

  @ApiPropertyOptional({ description: "Prénom du client" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  prenomClient?: string;

  @ApiPropertyOptional({ description: "Email du client" })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  mailClient?: string;
}

export class UpdateMoralEntityDto extends PartialType(CreateMoralEntityDto) {}
