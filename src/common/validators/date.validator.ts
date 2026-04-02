import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from "class-validator";

/**
 * Vérifie que la valeur est une date valide au format YYYY-MM-DD
 */
export function IsDateString(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isDateString",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== "string") return false;

          // Vérifier le format YYYY-MM-DD
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(value)) return false;

          // Vérifier que c'est une date valide
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;

          // Vérifier que la date reconstruite correspond (évite 2024-02-30)
          const [year, month, day] = value.split("-").map(Number);
          return (
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} doit être une date valide au format YYYY-MM-DD`;
        },
      },
    });
  };
}

/**
 * Vérifie que la date n'est pas dans le futur
 */
export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isNotFutureDate",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== "string") return false;
          const date = new Date(value);
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return date <= today;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} ne peut pas être dans le futur`;
        },
      },
    });
  };
}

/**
 * Vérifie que la date de fin est après la date de début
 */
export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isAfterDate",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          // eslint-disable-next-line security/detect-object-injection
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          if (typeof value !== "string" || typeof relatedValue !== "string") {
            return false;
          }
          return new Date(value) >= new Date(relatedValue);
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} doit être après ou égale à ${relatedPropertyName}`;
        },
      },
    });
  };
}
