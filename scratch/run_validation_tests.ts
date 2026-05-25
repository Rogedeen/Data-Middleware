import { FilterProcessor } from '../middleware/src/pipeline/filterProcessor';
import { MaskProcessor } from '../middleware/src/pipeline/maskProcessor';
import { LogBuilder } from '../middleware/src/builder/logBuilder';
import { IRawLogData, LogLevel, UserRole } from '../shared/types';
import { initializeFormatterFactory } from '../middleware/src/factory/formatterFactory';

async function runTests() {
  console.log('=== DATA MIDDLEWARE INTEGRATION VALIDATION TESTS ===\n');

  let passed = true;

  // Helper assert
  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`[PASS] - ${message}`);
    } else {
      console.error(`[FAIL] - ${message}`);
      passed = false;
    }
  }

  // 1. FILTER PROCESSOR TEST
  try {
    const filter = new FilterProcessor();
    const testLogs: IRawLogData[] = [
      { timestamp: '1', level: LogLevel.INFO, fullName: 'A', tcNo: '1', creditCard: '1', email: 'a', message: 'msg', debug: '' },
      { timestamp: '2', level: LogLevel.WARNING, fullName: 'B', tcNo: '2', creditCard: '2', email: 'b', message: 'msg', debug: '' },
      { timestamp: '3', level: LogLevel.ERROR, fullName: 'C', tcNo: '3', creditCard: '3', email: 'c', message: 'msg', debug: '' },
      { timestamp: '4', level: LogLevel.CRITICAL, fullName: 'D', tcNo: '4', creditCard: '4', email: 'd', message: 'msg', debug: '' }
    ];

    const result = await filter.process(testLogs);
    assert(result.length === 2, 'FilterProcessor drops INFO and WARNING logs');
    assert(result[0].level === LogLevel.ERROR, 'FilterProcessor keeps ERROR logs');
    assert(result[1].level === LogLevel.CRITICAL, 'FilterProcessor keeps CRITICAL logs');
  } catch (err: any) {
    console.error('FilterProcessor test threw an error:', err.message);
    passed = false;
  }

  // 2. MASK PROCESSOR TEST
  try {
    const mask = new MaskProcessor();
    
    // TCKN Masking
    const maskedTC1 = mask.maskTCKN('12345678901');
    assert(maskedTC1 === '*********01', `Valid 11-digit TCKN masked correctly: ${maskedTC1}`);
    const maskedTC2 = mask.maskTCKN('1234567890');
    assert(maskedTC2 === '1234567890', `Invalid 10-digit TCKN not masked: ${maskedTC2}`);

    // Credit Card Masking
    const maskedCC1 = mask.maskCreditCard('4352-8765-1234-9081');
    assert(maskedCC1 === '****-****-****-9081', `Dashed credit card masked correctly: ${maskedCC1}`);
    const maskedCC2 = mask.maskCreditCard('4352 8765 1234 9081');
    assert(maskedCC2 === '**** **** **** 9081', `Spaced credit card masked correctly: ${maskedCC2}`);
    const maskedCC3 = mask.maskCreditCard('4352876512349081');
    assert(maskedCC3 === '************9081', `Flat credit card masked correctly: ${maskedCC3}`);

    // Email Masking
    const maskedEmail1 = mask.maskEmail('john.doe@borsa.com');
    assert(maskedEmail1 === 'j*******@borsa.com', `Standard email masked correctly: ${maskedEmail1}`);
    const maskedEmail2 = mask.maskEmail('a@b.com');
    assert(maskedEmail2 === '*@b.com', `Short email masked correctly: ${maskedEmail2}`);
  } catch (err: any) {
    console.error('MaskProcessor test threw an error:', err.message);
    passed = false;
  }

  // 3. LOG BUILDER TEST
  try {
    const builder = new LogBuilder();
    const rawLog: IRawLogData = {
      timestamp: '2026-05-23 12:00:00',
      level: LogLevel.CRITICAL,
      fullName: 'A*** B***',
      tcNo: '*********01',
      creditCard: '****-****-****-9081',
      email: 'j*******@borsa.com',
      message: 'Critical error',
      debug: 'some details'
    };

    const processed = builder
      .reset(rawLog)
      .setSenderId('TEST-SENDER')
      .setTransactionNo('UUID-1234')
      .build();

    assert(processed.senderId === 'TEST-SENDER', 'LogBuilder sets senderId');
    assert(processed.transactionNo === 'UUID-1234', 'LogBuilder sets transactionNo');
    assert(processed.level === LogLevel.CRITICAL, 'LogBuilder retains log level');
  } catch (err: any) {
    console.error('LogBuilder test threw an error:', err.message);
    passed = false;
  }

  // 4. FACTORY & STRATEGY TEST
  try {
    const factory = initializeFormatterFactory();
    
    const htmlFormatter = factory.createFormatter(UserRole.SYSTEM_ADMIN);
    assert(htmlFormatter.getFormatType() === 'HTML', 'SYSTEM_ADMIN maps to HTML Strategy');

    const csvFormatter = factory.createFormatter(UserRole.CYBERSEC);
    assert(csvFormatter.getFormatType() === 'CSV', 'CYBERSEC maps to CSV Strategy');

    const jsonFormatter = factory.createFormatter(UserRole.WEB_DEV);
    assert(jsonFormatter.getFormatType() === 'JSON', 'WEB_DEV maps to JSON Strategy');
  } catch (err: any) {
    console.error('Factory & Strategy test threw an error:', err.message);
    passed = false;
  }

  console.log('\n====================================================');
  if (passed) {
    console.log('>>> ALL INTEGRATION VALIDATION TESTS PASSED SUCCESSFULLY! <<<');
  } else {
    console.error('>>> SOME INTEGRATION VALIDATION TESTS FAILED. <<<');
  }
}

runTests();
