import { requireText } from '../../../common/domain/value-objects/required-text.js';

export interface AllergenProps {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Global allergen list (e.g. GLUTEN, PEANUTS) shared by all restaurants. */
export class Allergen {
  private constructor(private props: AllergenProps) {}

  static create(params: { id: string; code: string; name: string }): Allergen {
    const now = new Date();
    return new Allergen({
      id: params.id,
      code: Allergen.normalizeCode(params.code),
      name: requireText(params.name, 'El nombre del alérgeno', { max: 100 }),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: AllergenProps): Allergen {
    return new Allergen(props);
  }

  static normalizeCode(code: string): string {
    return requireText(code, 'El código del alérgeno', { max: 50 }).toUpperCase();
  }

  rename(name: string): void {
    this.props.name = requireText(name, 'El nombre del alérgeno', { max: 100 });
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }
  get code(): string {
    return this.props.code;
  }
  get name(): string {
    return this.props.name;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
