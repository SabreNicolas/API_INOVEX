import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "eitherZoneOrAction", async: false })
class EitherZoneOrActionConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as { idZone?: number; idAction?: number };
    const hasZone = obj.idZone !== undefined && obj.idZone !== null;
    const hasAction = obj.idAction !== undefined && obj.idAction !== null;
    return (hasZone || hasAction) && !(hasZone && hasAction);
  }

  defaultMessage() {
    return "Vous devez fournir soit idZone, soit idAction (pas les deux)";
  }
}

export class CreateQuartCalendrierDto {
  @ApiPropertyOptional({
    example: 1,
    description: "ID de la zone (si type=zone)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idZone doit être un entier" })
  @Validate(EitherZoneOrActionConstraint)
  idZone?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'action (si type=action)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idAction doit être un entier" })
  idAction?: number;

  @ApiProperty({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsNotEmpty({ message: "La date de début est requise" })
  date_heure_debut: Date;

  @ApiProperty({
    example: 1,
    description: "Quart : 1=matin, 2=après-midi, 3=nuit",
  })
  @Type(() => Number)
  @IsInt({ message: "Le quart doit être un entier" })
  @IsNotEmpty({ message: "Le quart est requis" })
  quart: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Statut : 0=brouillon, 1=terminé",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "termine doit être un entier" })
  termine?: number;

  @ApiPropertyOptional({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsOptional()
  date_heure_fin?: Date;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'utilisateur assigné",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idUser doit être un entier" })
  idUser?: number;

  @ApiPropertyOptional({
    example: "2026-06-10",
    description: "Date de fin de récurrence",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "finReccurrence ne peut pas dépasser 255 caractères",
  })
  finReccurrence?: string;

  @ApiPropertyOptional({
    example: "Tous les lundis",
    description: "Phrase de récurrence",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "recurrencePhrase ne peut pas dépasser 100 caractères",
  })
  recurrencePhrase?: string;
}

export class UpdateQuartCalendrierDto {
  @ApiPropertyOptional({
    example: 1,
    description: "ID de la zone (si type=zone)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idZone doit être un entier" })
  idZone?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'action (si type=action)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idAction doit être un entier" })
  idAction?: number;

  @ApiPropertyOptional({
    example: "2026-03-10T08:00:00.000Z",
    description: "Date et heure de début",
  })
  @IsOptional()
  date_heure_debut?: Date;

  @ApiPropertyOptional({
    example: 1,
    description: "Quart : 1=matin, 2=après-midi, 3=nuit",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Le quart doit être un entier" })
  quart?: number;

  @ApiPropertyOptional({
    example: 0,
    description: "Statut : 0=brouillon, 1=terminé",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "termine doit être un entier" })
  termine?: number;

  @ApiPropertyOptional({
    example: "2026-03-10T16:00:00.000Z",
    description: "Date et heure de fin",
  })
  @IsOptional()
  date_heure_fin?: Date;

  @ApiPropertyOptional({
    example: 1,
    description: "ID de l'utilisateur assigné",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idUser doit être un entier" })
  idUser?: number;

  @ApiPropertyOptional({
    example: "2026-06-10",
    description: "Date de fin de récurrence",
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, {
    message: "finReccurrence ne peut pas dépasser 255 caractères",
  })
  finReccurrence?: string;

  @ApiPropertyOptional({
    example: "Tous les lundis",
    description: "Phrase de récurrence",
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, {
    message: "recurrencePhrase ne peut pas dépasser 100 caractères",
  })
  recurrencePhrase?: string;
}
