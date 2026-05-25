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
 * Log Senaryosu Arayüzü
 */
interface LogScenario {
  level: LogLevel;
  message: string;
  details: Record<string, any>;
}

/**
 * Borsa işlemlerine yönelik gerçekçi, seviyesine uygun log senaryosu üretir.
 */
function generateLogScenario(): LogScenario {
  const symbols = ['THYAO', 'EREGL', 'TUPRS', 'ASELS', 'GARAN'];
  const sides = ['BUY', 'SELL'];
  const symbol = faker.helpers.arrayElement(symbols);
  const side = faker.helpers.arrayElement(sides);
  const quantity = faker.number.int({ min: 10, max: 1000 });
  const price = parseFloat(faker.finance.amount({ min: 10, max: 500, dec: 2 }));
  const amount = parseFloat((quantity * price).toFixed(2));
  const ip = faker.internet.ipv4();
  const userAgent = faker.internet.userAgent();

  const scenarios: LogScenario[] = [
    // --- INFO Senaryoları (Başarılı İşlemler ve Normal Akış) ---
    {
      level: LogLevel.INFO,
      message: "User Session Started - Login Success",
      details: { action: "LOGIN", status: "SUCCESS", ip, userAgent }
    },
    {
      level: LogLevel.INFO,
      message: "User Session Termination - Logout Request",
      details: { action: "LOGOUT", ip, userAgent }
    },
    {
      level: LogLevel.INFO,
      message: `Limit Order Placed - Symbol: ${symbol}, Side: ${side}`,
      details: { symbol, side, quantity, price, amount, ip }
    },
    {
      level: LogLevel.INFO,
      message: `Market Order Executed Successfully - Symbol: ${symbol}`,
      details: { symbol, side, quantity, price, amount, executionId: faker.string.uuid() }
    },
    {
      level: LogLevel.INFO,
      message: `Deposit Funds Succeeded - Amount: $${amount}`,
      details: { type: "DEPOSIT", amount, ip, referenceNo: faker.string.alphanumeric(12).toUpperCase() }
    },

    // --- WARNING Senaryoları (Hafif Anomaliler, Sistem Çalışmasını Durdurmayan Durumlar) ---
    {
      level: LogLevel.WARNING,
      message: "User Session Warning - Login Failed (Invalid Credentials)",
      details: { action: "LOGIN", status: "FAILED", reason: "INVALID_CREDENTIALS", attemptCount: faker.number.int({ min: 1, max: 3 }), ip }
    },
    {
      level: LogLevel.WARNING,
      message: `Limit Order Cancelled by User - Symbol: ${symbol}`,
      details: { orderId: faker.string.uuid(), symbol, reason: "USER_REQUEST_CANCEL" }
    },
    {
      level: LogLevel.WARNING,
      message: "API Rate Limit Threshold Approaching - 80% Used",
      details: { clientIp: ip, remainingRequests: faker.number.int({ min: 10, max: 50 }), limitWindowSec: 60 }
    },

    // --- ERROR Senaryoları (Başarısız İşlemler, Kullanıcı/Sistem Hataları) ---
    {
      level: LogLevel.ERROR,
      message: "Limit Order Execution Failed - Insufficient Margin",
      details: { errorCode: "ERR_MARGIN_LACK", requiredMargin: amount, availableMargin: parseFloat((amount * 0.4).toFixed(2)), symbol }
    },
    {
      level: LogLevel.ERROR,
      message: "Withdraw Funds Failed - Insufficient Balance",
      details: { errorCode: "ERR_BALANCE_LACK", requestedAmount: amount, availableBalance: parseFloat((amount * 0.2).toFixed(2)) }
    },
    {
      level: LogLevel.ERROR,
      message: "Database Read Timeout - Transaction Rollback",
      details: { errorCode: "ERR_DB_TIMEOUT", queryType: "SELECT_USER_PORTFOLIO", durationMs: faker.number.int({ min: 5000, max: 8000 }), retryCount: 3 }
    },

    // --- CRITICAL Senaryoları (Güvenlik Alarmları, Kritik Sistem Hataları) ---
    {
      level: LogLevel.CRITICAL,
      message: "Security Alert - Multiple Failed Logins (Brute-Force Threat Detected)",
      details: { alarmId: "SEC_ALARM_01", attackerIp: ip, totalAttempts: faker.number.int({ min: 5, max: 15 }), targetAccount: faker.internet.email() }
    },
    {
      level: LogLevel.CRITICAL,
      message: "API Connection Refused - Exchange Broker API Offline",
      details: { alarmId: "SYS_ALARM_02", brokerEndpoint: "https://api.borsainternational.com/v1/trade", responseCode: 503, reason: "Service Unavailable" }
    },
    {
      level: LogLevel.CRITICAL,
      message: "System Resource Alert - Node RAM Out of Memory",
      details: { alarmId: "SYS_ALARM_03", heapUsedMb: faker.number.int({ min: 1900, max: 2048 }), heapTotalMb: 2048, percentage: "95%" }
    }
  ];

  // Ağırlıklı rastgele seçim: %70 INFO, %15 WARNING, %10 ERROR, %5 CRITICAL
  const roll = Math.random() * 100;
  let targetLevel: LogLevel;
  if (roll < 70) {
    targetLevel = LogLevel.INFO;
  } else if (roll < 85) {
    targetLevel = LogLevel.WARNING;
  } else if (roll < 95) {
    targetLevel = LogLevel.ERROR;
  } else {
    targetLevel = LogLevel.CRITICAL;
  }

  const matching = scenarios.filter(s => s.level === targetLevel);
  return faker.helpers.arrayElement(matching);
}

/**
 * Tekil ham log (IRawLogData) oluşturur.
 */
export function generateRawLog(): IRawLogData {
  const scenario = generateLogScenario();
  
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const timestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return {
    timestamp,
    level: scenario.level,
    fullName: faker.person.fullName(),
    tcNo: generateValidTCKN(),
    creditCard: faker.finance.creditCardNumber('####-####-####-####'),
    email: faker.internet.email(),
    message: scenario.message,
    debug: JSON.stringify(scenario.details)
  };
}
