import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class BadgeResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiPropertyOptional({ example: true })
  isEnabled: boolean | null;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'utilisateur associé",
  })
  userId: number | null;

  @ApiPropertyOptional({ example: null, description: "ID de la zone associée" })
  zoneId: number | null;

  @ApiPropertyOptional({ example: "ABC123DEF456" })
  uid: string | null;

  @ApiProperty({ example: 1 })
  idUsine: number;
}
