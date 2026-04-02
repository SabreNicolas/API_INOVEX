import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ProductResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: "Produit A" })
  Name: string | null;

  @ApiPropertyOptional({ example: "kg" })
  Unit: string | null;

  @ApiPropertyOptional({ example: 1, description: "1 = activé, 0 = désactivé" })
  Enabled: number | null;

  @ApiPropertyOptional({ example: "PRD001" })
  Code: string | null;

  @ApiPropertyOptional({ example: 1 })
  typeId: number | null;

  @ApiPropertyOptional({ example: 1 })
  idUsine: number | null;

  @ApiPropertyOptional({ example: "TAG001" })
  TAG: string;

  @ApiPropertyOptional({ example: "EQ001" })
  CodeEquipement: string;

  @ApiPropertyOptional({ example: "1" })
  Coefficient: string | null;
}
