# CENG302 Data Middleware - Video Sunum Metni

Bu metin, proje teslimi için hazırlayacağın **en fazla 15 dakikalık** sunum videosu için konuşma metni ve ekran akışı rehberidir.

---

## ⏱️ Video Bölümleri ve Süre Dağılımı

| Bölüm | Konu | Hedef Süre |
| :--- | :--- | :--- |
| **Giriş** | Proje konusu ve modüllerin tanıtımı | ~1.5 Dakika |
| **Bölüm 1** | Canlı çalıştırma demosu (Docker, çıktı dosyaları) | ~4.5 Dakika |
| **Bölüm 2** | Kod incelemesi: 4 Tasarım Kalıbı | ~6.0 Dakika |
| **Bölüm 3** | Performans, Backpressure ve Log Rotasyonu | ~2.0 Dakika |
| **Kapanış** | Özet ve teşekkür | ~1.0 Dakika |

---

## 🎙️ Adım Adım Sunum Akışı ve Konuşma Metni

### 🎬 Giriş (Süre: ~0:00 - 1:30)

- **Ekran:** GitHub deposu ana sayfası veya VS Code açık olsun.

> *"Merhaba hocam, ben [Adınız Soyadınız]. Bugün sizlere CENG302 Yazılım Mühendisliği Dönem Sonu Projesi kapsamında geliştirdiğim 'Data Middleware' projesini sunacağım.*
>
> *Projemizin amacı; bir borsa kuruluşu için saniyede binlerce log üreten bir simülatörden gelen ham verileri TCP soketi üzerinden dinlemek, bu logları gerçek zamanlı işleme boru hattından geçirerek kişisel verileri maskelemek, zenginleştirmek ve sistem yöneticileri, siber güvenlik uzmanları ve web geliştiricileri için HTML, CSV ve JSON formatlarında diske yazmaktır.*
>
> *Proje tamamen TypeScript ile yazılmış, Docker üzerinde çalışıyor. Bu sunumda sırasıyla canlı demoyu yapacak, kodda kullandığım 4 tasarım kalıbını tek tek gösterecek ve son olarak performans ölçümünü anlatacağım."*

---

### 🚀 Bölüm 1: Canlı Demo (Süre: ~1:30 - 6:00)

- **Ekran:** Terminal açın.

> *"Projemiz üç docker servisinden oluşuyor: middleware, producer ve log-rotator. Şu an arka planda çalışıyorlar.*
>
> *`docker compose ps` ile durumlarını kontrol edelim."* [Komutu çalıştır, çıktıyı göster]
>
> *"Middleware loglarına bakalım: `docker compose logs -f middleware`"* [Logların aktığını göster]
>
> *"Gördüğünüz gibi producer her 100ms'de 500 logluk paket gönderiyor, sistem bunları anlık alıp işliyor.*
>
> *Şimdi output klasörüne gidelim. Burada 3 dosya var:"*
>
> 1. *"`system_admin.html` — tarayıcıda açalım."* [Aç] *"CRITICAL satırlar kırmızı renkte vurgulanmış. Tüm loglar görünüyor ancak TC, kredi kartı, e-posta ve isim alanları maskelenmiş — KVKK uyumlu."*
> 2. *"`cybersec.csv` — Excel'de açalım."* [Aç] *"Noktalı virgül ayracı kullandık, Türkçe Excel'de her sütun düzgün bölünüyor. Kişisel veriler burada da maskelenmiş."*
> 3. *"`web_dev.json` — editörde açalım."* [Aç] *"Web geliştiriciler için tüm hata detayları, traceback bilgileri ve transaction numaraları tam JSON formatında burada."*
>
> *"Log seviyelerini kısaca açıklayayım: INFO başarılı işlemler, WARNING takip edilmesi gereken anomaliler, ERROR belirli bir işlemin başarısızlığı — mesela yetersiz teminat veya DB timeout — CRITICAL ise güvenlik alarmları ve sistem geneli tehditler."*
>
> *"Şimdi bu çıktıları üretmek için koda nasıl baktığımıza geçelim."*

---

### 💻 Bölüm 2: Tasarım Kalıpları (Süre: ~6:00 - 12:00)

> *"Projemde ödevde istenen tasarım kalıplarını kullandım. Bunları sırayla kod üzerinde göstereyim."*

---

#### 🔌 1. Adapter Pattern

- **Ekran:** `middleware/src/adapter/chunkAdapter.ts` dosyasını aç.

> *"İlk kalıbımız Adapter. TCP soketi bize ham byte akışı — Buffer — gönderiyor. Ama uygulamamız JSON nesneleriyle çalışıyor. Bu iki dünyayı birbirine bağlamak için Adapter kalıbını kullandım.*
>
> *`TCPChunkAdapter` sınıfına bakın:"*

```typescript
// middleware/src/adapter/chunkAdapter.ts

export class TCPChunkAdapter implements ITCPChunkAdapter {
  private buffer: string = '';  // yarım paketleri bekletir

  public pushChunk(chunk: Buffer, callback: (logs: IRawLogData[]) => void): void {
    this.buffer += chunk.toString('utf-8');   // Buffer → string

    const parts = this.buffer.split('\n');    // satırlara böl
    this.buffer = parts.pop() || '';          // yarım satırı sakla — bir sonraki chunk'ta tamamlanır

    for (const part of parts) {
      const parsedLogs = JSON.parse(part.trim());  // string → IRawLogData[]
      logs.push(...parsedLogs);
    }
    callback(logs);  // uygulama artık anlıyor
  }
}
```

> *"Ağda paket bölünmesi gerçek bir sorun — mesela `{"level":"ERRO` şeklinde yarım gelen veri bir sonraki chunk gelene kadar `this.buffer`'da bekliyor. Adapter bu karmaşıklığı tamamen içine alıyor, `server.ts` tarafı hiç görmüyor.*
>
> *Arayüzü `shared/interfaces.ts` dosyasında tanımlıyız:"*

```typescript
// shared/interfaces.ts
export interface ITCPChunkAdapter {
  pushChunk(chunk: Buffer, callback: (logs: IRawLogData[]) => void): void;
}
```

> *"`TCPChunkAdapter` bu arayüzü uygulayarak TCP'nin ham dünyasını, uygulamanın nesne dünyasına adapte ediyor. Klasik Adapter kalıbı bu."*

---

#### ⛓️ 2. Chain of Responsibility Pattern

- **Ekran:** `middleware/src/pipeline/` klasörünü aç, `logProcessor.ts`'i göster.

> *"İkinci kalıbımız Chain of Responsibility — Sorumluluk Zinciri. Log işleme üç ayrı adımdan oluşuyor: filtrele, maskele, zenginleştir. Bunları tek bir sınıfa koyabilirdim ama o zaman sınıf hem filtreleme hem maskeleme hem zenginleştirmeyi bilmek zorunda kalırdı — hem büyür hem test edilemez hale gelir.*
>
> *Bunun yerine her adımı bağımsız bir halka olarak tasarlayıp birbirine zincirledim.*
>
> *Önce soyut taban sınıfa bakalım:"*

```typescript
// middleware/src/pipeline/logProcessor.ts

export abstract class LogProcessor<TIn, TOut> implements ILogProcessor<TIn, TOut> {
  protected nextProcessor?: ILogProcessor<TOut, any>;

  public setNext(next): ILogProcessor {
    this.nextProcessor = next;
    return next;  // zincirleme: a.setNext(b).setNext(c)
  }

  protected async next(logs: TOut[]): Promise<any[]> {
    if (this.nextProcessor) return this.nextProcessor.process(logs);
    return logs;  // zincirin sonu — olduğu gibi döner
  }

  public abstract process(logs: TIn[]): Promise<TOut[]>;
}
```

> *"Her halka sadece kendi işini biliyor, işi bitince `this.next()` ile bir sonrakine iletiyor. Şimdi halkalar:"*

```typescript
// middleware/src/pipeline/filterProcessor.ts — Halka 1

export class FilterProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  async process(logs: IRawLogData[]): Promise<IRawLogData[]> {
    const filtered = logs.filter(
      log => log.level !== LogLevel.INFO && log.level !== LogLevel.WARNING
    );
    // INFO ve WARNING'ı çöpe at, kalanları bir sonraki halkaya gönder
    return this.next(filtered);
  }
}
```

```typescript
// middleware/src/pipeline/maskProcessor.ts — Halka 2

export class MaskProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  async process(logs: IRawLogData[]): Promise<IRawLogData[]> {
    const masked = logs.map(log => ({
      ...log,
      fullName: this.maskFullName(log.fullName),  // Ahmet Yılmaz → A**** Y****
      tcNo:     this.maskTCKN(log.tcNo),           // 12345678901 → *********01
      creditCard: this.maskCreditCard(log.creditCard), // son 4 hane açık
      email:    this.maskEmail(log.email),          // j******@example.com
    }));
    return this.next(masked);  // maskelenmiş logları ilerlet
  }
}
```

```typescript
// middleware/src/pipeline/enrichProcessor.ts — Halka 3

export class EnrichProcessor extends LogProcessor<IRawLogData, IProcessedLogData> {
  async process(logs: IRawLogData[]): Promise<IProcessedLogData[]> {
    const enriched = logs.map(log =>
      this.builder
        .reset(log)
        .setSenderId(this.senderId)          // bağlantının IP:port adresi
        .setTransactionNo(crypto.randomUUID()) // benzersiz işlem numarası
        .build()
    );
    return this.next(enriched);
  }
}
```

> *"Zincir `index.ts`'te tek seferlik kurulup `server.ts`'e enjekte ediliyor:"*

```typescript
// middleware/src/index.ts

function createPipeline(senderId: string) {
  const filterStep  = new FilterProcessor();
  const maskStep    = new MaskProcessor();
  const enrichStep  = new EnrichProcessor(new LogBuilder(), senderId);

  filterStep.setNext(maskStep).setNext(enrichStep);
  //  Filter ──► Mask ──► Enrich
  return filterStep;
}
```

> *"500 log giriyor, diyelim 350'si INFO/WARNING — FilterProcessor bunları düşürüyor. Kalan 150'ye MaskProcessor kişisel veri maskeleme uyguluyor. Geçen 150 log EnrichProcessor'da senderId ve UUID alıyor. Sonunda 150 adet tam işlenmiş log çıkıyor."*

---

#### 🎭 3. Strategy Pattern

- **Ekran:** `middleware/src/strategy/` klasörünü aç.

> *"Üçüncü kalıbımız Strategy — Strateji. Elimde işlenmiş log verisi var ve bunu 3 farklı formatta üretmem gerekiyor: sistem yöneticisi HTML istiyor, siber güvenlik ekibi CSV, web geliştirici JSON.*
>
> *Bunu tek bir sınıfta `if (rol == admin) { ... } else if (rol == cybersec) { ... }` şeklinde yazmak yerine, her formatı bağımsız bir Strateji sınıfına koydum.*
>
> *Ortak arayüz:"*

```typescript
// shared/interfaces.ts
export interface IFormatStrategy {
  format(logs: IProcessedLogData[]): string;
  getFormatType(): OutputFormat;
}
```

> *"Bu arayüzü uygulayan 3 bağımsız sınıf var. Her birini açalım:"*

```typescript
// middleware/src/strategy/htmlStrategy.ts

export class HtmlStrategy implements IFormatStrategy {
  getFormatType() { return OutputFormat.HTML; }

  private escapeHtml(value: string): string {
    return String(value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');  // XSS koruması
  }

  format(logs: IProcessedLogData[]): string {
    // CRITICAL satırları kırmızı badge + kırmızı sol border
    const rows = logs.map(log => {
      const isCritical = log.level === 'CRITICAL';
      return `<tr ${isCritical ? 'class="critical-row"' : ''}>
        <td>${this.escapeHtml(log.timestamp)}</td>
        <td><span class="badge ${isCritical ? 'badge-critical' : 'badge-error'}">
          ${this.escapeHtml(log.level)}</span></td>
        <td>${this.escapeHtml(log.fullName)}</td>
        ...
      </tr>`;
    }).join('');
    return `<!DOCTYPE html>...<table>..${rows}..</table>`;
  }
}
```

```typescript
// middleware/src/strategy/csvStrategy.ts

export class CsvStrategy implements IFormatStrategy {
  getFormatType() { return OutputFormat.CSV; }

  format(logs: IProcessedLogData[]): string {
    return logs.map(log =>
      [log.timestamp, log.level, this.escapeCsv(log.fullName),
       log.tcNo, log.creditCard, log.email,
       this.escapeCsv(log.message), log.senderId, log.transactionNo,
       this.escapeCsv(log.debug)].join(';')  // Türkçe Excel uyumu için ;
    ).join('\n');
  }

  private escapeCsv(field: string): string {
    if (field.includes(';') || field.includes('"'))
      return `"${field.replace(/"/g, '""')}"`;
    return field;
  }
}
```

```typescript
// middleware/src/strategy/jsonStrategy.ts

export class JsonStrategy implements IFormatStrategy {
  getFormatType() { return OutputFormat.JSON; }
  format(logs: IProcessedLogData[]): string {
    return JSON.stringify(logs, null, 2);
  }
}
```

> *"Üç strateji de aynı `format(logs)` metodunu çağırıyorum ama her biri tamamen farklı çıktı üretiyor. `server.ts` hiçbirinin iç mantığını bilmiyor:"*

```typescript
// server.ts — strateji kim olursa olsun aynı kod
const formatter = this.formatterFactory.createFormatter(UserRole.SYSTEM_ADMIN);
const output    = formatter.format(this.allProcessedLogs);
console.log(`[Middleware] Updated ${formatter.getFormatType()} output.`);
// → "Updated HTML output."
```

---

#### 🏭 4. Factory Method Pattern

- **Ekran:** `middleware/src/factory/formatterFactory.ts` dosyasını aç.

> *"Dördüncü kalıbımız Factory Method — Fabrika. `server.ts` içinde strateji nesnesi oluşturmam gerekiyor. `new HtmlStrategy()`, `new CsvStrategy()` gibi doğrudan yazabilirim. Ama bu durumda `server.ts` her strateji sınıfına doğrudan bağımlı hale gelir — yeni bir format eklediğimde `server.ts`'i de değiştirmem gerekir. Bu SOLID'in Open-Closed ilkesini ihlal eder.*
>
> *Çözüm: nesne üretim sorumluluğunu Fabrika'ya devrettim. Üstelik switch-case yerine Registry haritası kullandım:"*

```typescript
// middleware/src/factory/formatterFactory.ts

export class FormatterFactory implements IFormatterFactory {
  // rol → constructor fonksiyonu eşlemesi
  private registry = new Map<UserRole, () => IFormatStrategy>();

  public register(role: UserRole, creator: () => IFormatStrategy): void {
    this.registry.set(role, creator);  // tarif ekle
  }

  public createFormatter(role: UserRole): IFormatStrategy {
    const creator = this.registry.get(role);
    if (!creator) throw new Error(`No strategy for role: ${role}`);
    return creator();  // → new HtmlStrategy() / new CsvStrategy() / ...
  }
}

// Fabrika kurulumu — sadece bir kere çalışır
export function initializeFormatterFactory(): FormatterFactory {
  const factory = new FormatterFactory();

  factory.register(UserRole.SYSTEM_ADMIN, () => new HtmlStrategy());
  factory.register(UserRole.CYBERSEC,     () => new CsvStrategy());
  factory.register(UserRole.WEB_DEV,      () => new JsonStrategy());

  return factory;
}
```

> *"Yeni bir rol eklediğimde — mesela COMPLIANCE için XML formatı — fabrika koduna hiç dokunmuyorum:"*

```typescript
// Sadece bu bir satır yeterli:
factory.register(UserRole.COMPLIANCE, () => new XmlStrategy());
```

> *"Bu sayede Open-Closed prensibine tam uyum sağlanıyor: sisteme yeni şeyler eklenebilir, ama mevcut kod değiştirilmez.*
>
> *Özet olarak 4 kalıbı birleştirince şöyle bir akış ortaya çıkıyor:*
>
> *TCP Buffer gelir → **Adapter** onu `IRawLogData[]`'ya çevirir → **CoR Zinciri** filtreler, maskeler, zenginleştirir → **Factory** role uygun stratejiyi üretir → **Strategy** çıktıyı formatlar → diske yazılır."*

---

### ⚡ Bölüm 3: Performans ve Log Rotasyonu (Süre: ~12:00 - 14:00)

- **Ekran:** `docker compose logs -f middleware` çıktısını göster.

> *"Son olarak performans kısmına bakalım. Sunucuya gerçek zamanlı bir ölçüm motoru entegre ettim. Ekranda her 1 saniyede bir şunu görüyorsunuz:"*

```
[Performance Metrics] Total Processed: 74000 logs | Speed: 812.34 logs/sec |
Avg Batch Latency: 1.43ms | RAM Heap: 27.12 MB | Queue Size: 0
```

> *"Bu metrikler `process.hrtime()` ile mikrosaniye hassasiyetinde ölçülüyor.*
>
> *Yüksek yük testinde — docker-compose'da CHUNK_SIZE=5000, GENERATION_INTERVAL_MS=5 yaparak saniyede 1 milyon log gönderdiğimizde — sistem maksimum kapasitesine ulaşıyor. Bu donanımda saniyede 40-65 bin log işliyor.*
>
> *Bellek patlamasını önlemek için Watermark sistemi var:"*
>
> - *Kuyruk **10.000 loga** ulaşınca → `socket.pause()` — TCP akışı durdurulur*
> - *Kuyruk **2.000 logun** altına inince → `socket.resume()` — akış devam eder*
> - *Bu sayede RAM **45-55 MB** aralığında sabit kalıyor, OOM hatası oluşmuyor.*
>
> *Log rotasyonu: `cybersec.csv` **5 MB** sınırını aşınca alpine sidecar container dosyayı arşivliyor, maksimum 4 arşiv tutuluyor — toplam disk kullanımı 20 MB ile sınırlı."* [output klasöründeki cybersec.1.csv, .2.csv dosyalarını göster]

---

### 🏁 Kapanış (Süre: ~14:00 - 15:00)

- **Ekran:** GitHub deposu veya proje klasörü.

> *"Özetlemek gerekirse; bu projede bir borsa ara katmanının güvenlik, filtreleme, zenginleştirme ve rol bazlı çıktı gereksinimlerini 4 tasarım kalıbını birlikte kullanarak gerçekledim: TCP akışını ayrıştırmak için Adapter, log işleme boru hattı için Chain of Responsibility, rol bazlı çıktı için Strategy ve OCP uyumlu nesne üretimi için Factory.*
>
> *Kodun tamamı TypeScript ile yazılmış, Dockerize edilmiş ve GitHub depoma yüklenmiştir. Beni dinlediğiniz için teşekkür ederim. Sorularınız varsa yanıtlamaktan memnuniyet duyarım."*
