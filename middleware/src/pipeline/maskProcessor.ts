import { LogProcessor } from './logProcessor';
import { IRawLogData } from '../../../shared/types';

export class MaskProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  public async process(logs: IRawLogData[]): Promise<IRawLogData[]> {
    const masked = logs.map((log) => this.maskLog(log));
    return this.next(masked);
  }

  private maskLog(log: IRawLogData): IRawLogData {
    return {
      ...log,
      fullName: this.maskFullName(log.fullName),
      tcNo: this.maskTCKN(log.tcNo),
      creditCard: this.maskCreditCard(log.creditCard),
      email: this.maskEmail(log.email),
    };
  }

  /**
   * T.C. Kimlik Numarasını maskeler (örn: 12345678901 -> *********01)
   */
  public maskTCKN(tc: string): string {
    const trimmed = tc.trim();
    if (!/^\d{11}$/.test(trimmed)) return tc;
    return '*********' + trimmed.slice(9);
  }

  /**
   * Kredi Kartını maskeler ve son 4 hanesini açık bırakır.
   * Format koruması sağlar (boşluk veya tire işaretlerini saklar).
   */
  public maskCreditCard(cc: string): string {
    const digitsOnly = cc.replace(/\D/g, '');
    if (digitsOnly.length < 13 || digitsOnly.length > 19) return cc;

    let digitCounter = 0;
    const maskLimit = digitsOnly.length - 4;

    return cc
      .split('')
      .map((char) => {
        if (/\d/.test(char)) {
          if (digitCounter < maskLimit) {
            digitCounter++;
            return '*';
          }
        }
        return char;
      })
      .join('');
  }

  /**
   * E-posta adresini, alan adını (domain) koruyacak şekilde maskeler.
   * örn: john.doe@example.com -> j***.d**e@example.com
   */
  public maskEmail(email: string): string {
    const trimmed = email.trim();
    const parts = trimmed.split('@');
    if (parts.length !== 2) return email;
    
    const [local, domain] = parts;
    if (local.length <= 1) {
      return `*@${domain}`;
    }

    // İlk karakteri açık bırakıp kalanını maskele
    const maskedLocal = local[0] + '*'.repeat(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  /**
   * İsim ve soyismin ilk harfleri hariç diğer kısımlarını maskeler.
   */
  private maskFullName(name: string): string {
    return name
      .split(' ')
      .map((part) => {
        if (part.length <= 1) return '*';
        return part[0] + '*'.repeat(part.length - 1);
      })
      .join(' ');
  }
}
