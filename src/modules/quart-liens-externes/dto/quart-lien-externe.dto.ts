import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateQuartLienExterneDto {
  @ApiProperty({
    example: "Documentation technique",
    description: "Nom du lien externe",
  })
  @IsString()
  @IsNotEmpty({ message: "Le nom est requis" })
  @MaxLength(200, { message: "Le nom ne peut pas dépasser 200 caractères" })
  nom: string;

  @ApiProperty({
    example: "https://example.com/doc",
    description: "URL du lien externe",
  })
  @IsString()
  @IsNotEmpty({ message: "L'URL est requise" })
  @MaxLength(250, { message: "L'URL ne peut pas dépasser 250 caractères" })
  url: string;

  @ApiPropertyOptional({
    example: true,
    description: "Actif (true = oui, false = non)",
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "Le champ actif doit être un booléen" })
  actif?: boolean;
}

export class UpdateQuartLienExterneDto {
  @ApiPropertyOptional({
    example: "Documentation technique modifiée",
    description: "Nom du lien externe",
  })
  @IsOptional()
  @IsString()
  @MaxLength(200, { message: "Le nom ne peut pas dépasser 200 caractères" })
  nom?: string;

  @ApiPropertyOptional({
    example: "https://example.com/doc-updated",
    description: "URL du lien externe",
  })
  @IsOptional()
  @IsString()
  @MaxLength(250, { message: "L'URL ne peut pas dépasser 250 caractères" })
  url?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Actif (true = oui, false = non)",
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: "Le champ actif doit être un booléen" })
  actif?: boolean;
}
