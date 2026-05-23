import { IFormatterFactory, IFormatStrategy } from '../../../shared/interfaces';
import { UserRole } from '../../../shared/types';
import { HtmlStrategy } from '../strategy/htmlStrategy';
import { CsvStrategy } from '../strategy/csvStrategy';
import { JsonStrategy } from '../strategy/jsonStrategy';

export class FormatterFactory implements IFormatterFactory {
  private registry = new Map<UserRole, () => IFormatStrategy>();

  public register(role: UserRole, creator: () => IFormatStrategy): void {
    this.registry.set(role, creator);
  }

  public createFormatter(role: UserRole): IFormatStrategy {
    const creator = this.registry.get(role);
    if (!creator) {
      throw new Error(`[FormatterFactory] No formatting strategy registered for UserRole: ${role}`);
    }
    return creator();
  }
}

/**
 * Varsayılan rollere göre stratejileri kaydederek fabrika sınıfını başlatır.
 */
export function initializeFormatterFactory(): FormatterFactory {
  const factory = new FormatterFactory();
  
  // Varsayılan rol ve format eşleştirmelerini kaydet (OCP Uyumlu)
  factory.register(UserRole.SYSTEM_ADMIN, () => new HtmlStrategy());
  factory.register(UserRole.CYBERSEC, () => new CsvStrategy());
  factory.register(UserRole.WEB_DEV, () => new JsonStrategy());

  return factory;
}
