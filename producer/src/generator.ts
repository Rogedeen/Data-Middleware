import { faker } from '@faker-js/faker';
import { IRawLogData, LogLevel } from '../../shared/types';

/**
 * Algoritmik olarak geçerli (checksum kurallarına uyan) T.C. Kimlik Numarası üretir.
 */
export function generateValidTCKN(): string {
  const digits = new Array<number>(9);
  
  // İlk hane 0 olamaz
  digits[0] = Math.floor(Math.random() * 9) + 1;
  
  for (let i = 1; i < 9; i++) {
    digits[i] = Math.floor(Math.random() * 10);
  }

  // 10. Hane Algoritması
  // (1, 3, 5, 7 ve 9. hanelerin toplamının 7 katından, 2, 4, 6 ve 8. hanelerin toplamı çıkartılır) % 10
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const digit10 = ((oddSum * 7) - evenSum) % 10;
  
  // Modulo sonucunun negatif çıkması durumuna karşı +10 eklenerek pozitif kalması garanti altına alınır
  const formattedDigit10 = digit10 < 0 ? (digit10 + 10) % 10 : digit10;
  
  // 11. Hane Algoritması
  // (1, 2, 3, 4, 5, 6, 7, 8, 9 ve 10. hanelerin toplamı) % 10
  const first10Sum = oddSum + evenSum + formattedDigit10;
  const formattedDigit11 = first10Sum % 10;

  return [...digits, formattedDigit10, formattedDigit11].join('');
}

/**
 * Borsa işlemlerine yönelik gerçekçi log mesajı ve detay şablonları üretir.
 */
function getRandomLogContent(): { message: string; details: string } {
  const symbols = ['THYAO', 'EREGL', 'TUPRS', 'ASELS', 'GARAN', 'BTCUSD', 'ETHUSD'];
  const sides = ['BUY', 'SELL'];
  const symbol = faker.helpers.arrayElement(symbols);
  const side = faker.helpers.arrayElement(sides);
  const quantity = faker.number.int({ min: 10, max: 10000 });
  const price = parseFloat(faker.finance.amount({ min: 10, max: 500, dec: 2 }));
  const amount = parseFloat((quantity * price).toFixed(2));
  const ip = faker.internet.ipv4();
  const userAgent = faker.internet.userAgent();

  const templates = [
    {
      message: `Limit Order Placed - Symbol: ${symbol}, Side: ${side}`,
      details: { symbol, side, quantity, price, amount, ip, userAgent }
    },
    {
      message: `Market Order Executed Successfully - Symbol: ${symbol}, Side: ${side}`,
      details: { symbol, side, quantity, price, amount, ip, userAgent, executionId: faker.string.uuid() }
    },
    {
      message: `Limit Order Execution Failed - Insufficient Margin`,
      details: { symbol, side, quantity, price, amount, ip, userAgent, errorCode: 'ERR_MARGIN_LACK' }
    },
    {
      message: `Deposit Funds Succeeded - Amount: $${amount}`,
      details: { type: 'DEPOSIT', amount, ip, userAgent, referenceNo: faker.string.alphanumeric(12).toUpperCase() }
    },
    {
      message: `Withdraw Funds Requested - Amount: $${amount}`,
      details: { type: 'WITHDRAW', amount, ip, userAgent, referenceNo: faker.string.alphanumeric(12).toUpperCase() }
    },
    {
      message: `User Session Started - Login Success`,
      details: { action: 'LOGIN', status: 'SUCCESS', ip, userAgent }
    },
    {
      message: `User Session Termination - Logout Request`,
      details: { action: 'LOGOUT', ip, userAgent }
    }
  ];

  const selected = faker.helpers.arrayElement(templates);
  return {
    message: selected.message,
    details: JSON.stringify(selected.details)
  };
}

/**
 * Tekil ham log (IRawLogData) oluşturur.
 */
export function generateRawLog(): IRawLogData {
  // Log seviyeleri için ağırlıklı rastgele dağılım
  // %70 INFO, %15 WARNING, %10 ERROR, %5 CRITICAL
  const levels = [
    ...Array(70).fill(LogLevel.INFO),
    ...Array(15).fill(LogLevel.WARNING),
    ...Array(10).fill(LogLevel.ERROR),
    ...Array(5).fill(LogLevel.CRITICAL)
  ];
  const level = faker.helpers.arrayElement(levels);
  const { message, details } = getRandomLogContent();

  return {
    timestamp: new Date().toISOString(),
    level,
    fullName: faker.person.fullName(),
    tcNo: generateValidTCKN(),
    creditCard: faker.finance.creditCardNumber('####-####-####-####'),
    email: faker.internet.email(),
    message,
    details
  };
}
