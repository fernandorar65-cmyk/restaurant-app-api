import { BadRequestException } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

type Translator = (property: string, original: string) => string;

const firstNumber = (text: string): string => text.match(/-?\d+(\.\d+)?/)?.[0] ?? '?';
const allowedValues = (text: string): string => text.split(': ').slice(1).join(': ');

/**
 * Spanish messages for the class-validator constraints used in the DTOs.
 * Parameters (lengths, limits, allowed values) are read from the default
 * English message so the translation stays in sync with the decorators.
 */
const TRANSLATIONS: Partial<Record<string, Translator>> = {
  isString: (p) => `${p} debe ser texto`,
  isEmail: (p) => `${p} debe ser un correo válido`,
  isUuid: (p) => `${p} debe ser un UUID válido`,
  isInt: (p) => `${p} debe ser un número entero`,
  isNumber: (p) => `${p} debe ser un número válido (revisa los decimales permitidos)`,
  isBoolean: (p) => `${p} debe ser verdadero o falso`,
  isArray: (p) => `${p} debe ser una lista`,
  isObject: (p) => `${p} debe ser un objeto`,
  isDate: (p) => `${p} debe ser una fecha válida`,
  isUrl: (p) => `${p} debe ser una URL válida`,
  isLatitude: (p) => `${p} debe ser una latitud válida (entre -90 y 90)`,
  isLongitude: (p) => `${p} debe ser una longitud válida (entre -180 y 180)`,
  minLength: (p, m) => `${p} debe tener al menos ${firstNumber(m)} caracteres`,
  maxLength: (p, m) => `${p} no puede superar los ${firstNumber(m)} caracteres`,
  isLength: (p, m) =>
    m.includes('longer')
      ? `${p} debe tener al menos ${firstNumber(m)} caracteres`
      : `${p} no puede superar los ${firstNumber(m)} caracteres`,
  min: (p, m) => `${p} debe ser mayor o igual a ${firstNumber(m)}`,
  max: (p, m) => `${p} debe ser menor o igual a ${firstNumber(m)}`,
  arrayMinSize: (p, m) => `${p} debe tener al menos ${firstNumber(m)} elemento(s)`,
  isEnum: (p, m) => `${p} debe ser uno de: ${allowedValues(m)}`,
  isIn: (p, m) => `${p} debe ser uno de: ${allowedValues(m)}`,
  matches: (p) => `${p} no tiene el formato esperado`,
  whitelistValidation: (p) => `La propiedad ${p} no está permitida`,
  nestedValidation: (p) => `${p} debe ser un objeto válido`,
};

/** Default class-validator messages are "<property> must ..." / "... should not exist". */
function isDefaultMessage(message: string): boolean {
  return / must /.test(message) || message.endsWith('should not exist');
}

function collectMessages(
  errors: ValidationError[],
  parentPath = '',
): string[] {
  return errors.flatMap((error) => {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([key, message]) => {
      const translate = TRANSLATIONS[key];
      // Messages written explicitly in a DTO are already in Spanish: keep them.
      return translate && isDefaultMessage(message) ? translate(path, message) : message;
    });
    return [...own, ...collectMessages(error.children ?? [], path)];
  });
}

/** ValidationPipe exceptionFactory: Spanish messages + stable errorCode. */
export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  return new BadRequestException({
    message: collectMessages(errors),
    errorCode: 'VALIDATION_ERROR',
  });
}
