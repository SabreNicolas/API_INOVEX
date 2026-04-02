import { ApiProperty } from "@nestjs/swagger";

export class MessageResponseDto {
  @ApiProperty({ example: "Opération réalisée avec succès" })
  message: string;
}

export class IdResponseDto {
  @ApiProperty({ example: 1, description: "ID de l'entité créée" })
  id: number;
}
