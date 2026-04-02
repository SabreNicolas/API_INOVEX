import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from "@nestjs/common";

/**
 * Pipe pour valider et transformer les paramètres de date au format YYYY-MM-DD
 */
@Injectable()
export class ParseDatePipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    // Vérifier le format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      throw new BadRequestException(
        `Le paramètre ${metadata.data || "date"} doit être au format YYYY-MM-DD`
      );
    }

    // Vérifier que c'est une date valide
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        `Le paramètre ${metadata.data || "date"} n'est pas une date valide`
      );
    }

    // Vérifier que la date reconstruite correspond (évite 2024-02-30)
    const [year, month, day] = value.split("-").map(Number);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new BadRequestException(
        `Le paramètre ${metadata.data || "date"} n'est pas une date valide`
      );
    }

    return value;
  }
}
