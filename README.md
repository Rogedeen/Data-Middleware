# CENG302 — Data Middleware

**Yazılım Mühendisliği Dönem Sonu Projesi**

**Sunum Linki: https://youtu.be/tZZpbhbiFus**
**Repo linki: https://github.com/Rogedeen/Data-Middleware**

Bir borsa kuruluşu için geliştirilmiş gerçek zamanlı log ara katmanı (middleware). Saniyede binlerce log üreten bir simülatörden TCP soketi üzerinden veri alır; kişisel verileri maskeler, logları zenginleştirir ve farklı rollere (System Admin, CyberSec, Web Dev) göre HTML, CSV ve JSON formatlarında diske yazar. Google Antigravity üzerinden multi-agent AI ile geliştirilmiştir.

---

## 📋 İçindekiler

- [Sistem Gereksinimleri](#-sistem-gereksinimleri)
- [Kurulum ve Çalıştırma](#-kurulum-ve-çalıştırma)
- [Çıktı Dosyaları](#-çıktı-dosyaları)
- [Sistem Mimarisi](#-sistem-mimarisi)
- [Veri Akışı](#-veri-akışı)
- [Kullanılan Tasarım Kalıpları](#-kullanılan-tasarım-kalıpları)
- [SOLID Prensipleri](#-solid-prensipleri)
- [Performans ve Backpressure](#-performans-ve-backpressure)
- [Log Rotasyonu](#-log-rotasyonu)
- [Geliştirme Süreci](#-geliştirme-süreci)
- [Proje Yapısı](#-proje-yapısı)

---

## ⚙️ Sistem Gereksinimleri

| Bağımlılık | Minimum Sürüm |
|---|---|
| Docker | 20.x |
| Docker Compose | 2.x |
| Node.js *(opsiyonel, yerel geliştirme için)* | 18.x |
| TypeScript *(opsiyonel)* | 5.x |

---

## 🚀 Kurulum ve Çalıştırma

### 1. Repoyu Klonla

```bash
git clone https://github.com/Rogedeen/Data-Middleware.git
cd Data-Middleware
```

### 2. Sistemi Başlat

```bash
docker compose up --build -d
```

Bu komut üç servisi ayağa kaldırır:

| Servis | Konteyner Adı | Görev |
|---|---|---|
| `middleware` | `ceng302-middleware` | TCP sunucusu, log işleme motoru |
| `producer` | `ceng302-producer` | Log verisi üreten simülatör |
| `log-rotator` | `ceng302-log-rotator` | CSV dosya rotasyonu sidecar'ı |

### 3. Durumu Kontrol Et

```bash
docker compose ps
```

### 4. Gerçek Zamanlı Log Akışını İzle

```bash
# Middleware işleme logları (performans metrikleri burada görünür)
docker compose logs -f middleware

# Producer logları
docker compose logs -f producer
```

### 5. Sistemi Durdur

```bash
docker compose down
```

---

### 🔧 Yük Testi Yapılandırması

`docker-compose.yml` içindeki `producer` servisi ortam değişkenleriyle yapılandırılır:

```yaml
environment:
  - CHUNK_SIZE=500              # Her paketteki log sayısı
  - GENERATION_INTERVAL_MS=100  # Paketler arası bekleme (ms)
```

**Senaryo A — Normal Yük:**

```yaml
CHUNK_SIZE=500
GENERATION_INTERVAL_MS=100   # → Saniyede ~5.000 ham log
```

**Senaryo B — Stres Testi:**

```yaml
CHUNK_SIZE=5000
GENERATION_INTERVAL_MS=5     # → Saniyede ~1.000.000 ham log
```

---

## 📂 Çıktı Dosyaları

Sistem çalıştığında `output/` klasöründe üç dosya oluşturulur:

| Dosya | Rol | Açıklama |
|---|---|---|
| `system_admin.html` | System Admin | CRITICAL satırlar kırmızı vurgulanmış HTML tablo; tüm oturum logları birikimli olarak gösterilir |
| `cybersec.csv` | CyberSec | Noktalı virgül (`;`) ayraçlı, SIEM uyumlu CSV; satırlar append ile eklenir |
| `web_dev.json` | Web Dev | Tüm işlenmiş logları içeren, pretty-print JSON dizisi |

> **Not:** Tüm dosyalarda kişisel veriler (TC Kimlik, kredi kartı, e-posta, isim) KVKK uyumlu biçimde maskelenerek sunulur.

### Maskeleme Örnekleri

| Alan | Ham Veri | Maskelenmiş |
|---|---|---|
| İsim | `Ahmet Yılmaz` | `A**** Y****` |
| TC Kimlik | `12345678901` | `*********01` |
| Kredi Kartı | `4355-4567-8901-2345` | `****-****-****-2345` |
| E-posta | `johndoe@example.com` | `j******@example.com` |

---

## 🏗️ Sistem Mimarisi

Sistem iki Docker modülünden oluşur ve `ceng302-net` köprü ağı üzerinde haberleşir:

```
┌─────────────────────────────────────────────────────────────────┐
│                        ceng302-net (bridge)                     │
│                                                                 │
│  ┌──────────────────┐   TCP :3000   ┌──────────────────────┐   │
│  │   ceng302-       │ ──────────►  │   ceng302-           │   │
│  │   producer       │              │   middleware          │   │
│  │                  │ ◄──────────  │                      │   │
│  │  faker.js ile    │  backpressure │  Filtrele            │   │
│  │  log üretimi     │  (pause/      │  Maskele             │   │
│  │  NDJSON + \n     │   resume)     │  Zenginleştir        │   │
│  └──────────────────┘              │  Formatla → Yaz      │   │
│                                    └──────────┬───────────┘   │
│  ┌──────────────────┐                         │ volume        │
│  │  ceng302-        │                         ▼               │
│  │  log-rotator     │◄──────────── ./output/                  │
│  │  (alpine sidecar)│  5 MB limit             ├─ system_admin.html │
│  └──────────────────┘                         ├─ cybersec.csv      │
│                                               └─ web_dev.json      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Veri Akışı

```
Producer
  │
  │  faker.js → IRawLogData[] → JSON.stringify + "\n" (NDJSON)
  │  TCP socket.write(payload)
  │
  ▼ [TCP Buffer akışı]
  │
  ├─ [ADAPTER] TCPChunkAdapter.pushChunk()
  │    Buffer birikiyor → "\n" ayracıyla bölünüyor → JSON.parse
  │    → IRawLogData[] callback ile iletiliyor
  │
  ▼ [Kuyruk — High Watermark: 10.000 / Low Watermark: 2.000]
  │
  ├─ [CoR Halka 1] FilterProcessor
  │    log.level === INFO | WARNING  →  ❌ DROP
  │    log.level === ERROR | CRITICAL →  ✅ devam
  │
  ├─ [CoR Halka 2] MaskProcessor
  │    fullName, tcNo, creditCard, email  →  maskelendi
  │
  ├─ [CoR Halka 3] EnrichProcessor
  │    senderId = socket.remoteAddress:port  (dinamik)
  │    transactionNo = crypto.randomUUID()
  │    → IProcessedLogData[]
  │
  ▼
  ├─ [FACTORY] FormatterFactory.createFormatter(role)
  │    SYSTEM_ADMIN → HtmlStrategy
  │    CYBERSEC     → CsvStrategy
  │    WEB_DEV      → JsonStrategy
  │
  ├─ [STRATEGY] formatter.format(allProcessedLogs)
  │
  ▼
  output/system_admin.html   (birikimli, writeFileSync)
  output/cybersec.csv        (append, appendFileSync)
  output/web_dev.json        (birikimli, writeFileSync)
```

---

## 🎨 Kullanılan Tasarım Kalıpları

Projede 4 tasarım kalıbı arayüzler (`shared/interfaces.ts`) üzerinden uygulanmıştır.

---

### 1. 🔌 Adapter Pattern

**Dosya:** [`middleware/src/adapter/chunkAdapter.ts`](middleware/src/adapter/chunkAdapter.ts)
**Arayüz:** `ITCPChunkAdapter`

**Problem:** TCP soketi verileri ham byte akışı (`Buffer`) olarak iletir. Ağda paket bölünmesi (fragmentation) veya birleşmesi (merging) gerçekleşebilir. Uygulama ise `IRawLogData[]` nesneleriyle çalışmak zorundadır.

**Çözüm:** `TCPChunkAdapter`, gelen `Buffer`'ları bir iç tamponda biriktirip `\n` ayracına göre bölerek geçerli JSON satırlarına dönüştürür.

```typescript
export class TCPChunkAdapter implements ITCPChunkAdapter {
  private buffer: string = '';

  public pushChunk(chunk: Buffer, callback: (logs: IRawLogData[]) => void): void {
    this.buffer += chunk.toString('utf-8');

    const parts = this.buffer.split('\n');
    this.buffer = parts.pop() || ''; // yarım satırı bir sonraki chunk'a bırak

    for (const part of parts) {
      const parsedLogs: IRawLogData[] = JSON.parse(part.trim());
      logs.push(...parsedLogs);
    }
    callback(logs);
  }
}
```

---

### 2. ⛓️ Chain of Responsibility Pattern

**Dosyalar:** [`middleware/src/pipeline/`](middleware/src/pipeline/)
**Arayüz:** `ILogProcessor<TIn, TOut>`

**Problem:** Log işleme birden fazla bağımsız adımdan oluşuyor (filtrele → maskele → zenginleştir). Bunları tek sınıfa koymak Single Responsibility ve Open/Closed prensiplerini ihlal eder.

**Çözüm:** Her adım kendi halkasında, soyut `LogProcessor<TIn, TOut>` sınıfından türeyen bağımsız bir işlemci sınıfı olarak tanımlanmıştır.

```typescript
// Soyut taban
abstract class LogProcessor<TIn, TOut> {
  protected nextProcessor?: ILogProcessor<TOut, any>;

  setNext(next): ILogProcessor { this.nextProcessor = next; return next; }

  protected async next(logs: TOut[]): Promise<any[]> {
    return this.nextProcessor ? this.nextProcessor.process(logs) : logs;
  }

  abstract process(logs: TIn[]): Promise<TOut[]>;
}

// Halka 1 — Filtrele
class FilterProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  async process(logs) {
    const filtered = logs.filter(l => l.level !== 'INFO' && l.level !== 'WARNING');
    return this.next(filtered); // INFO/WARN düşürüldü, kalanlar ilerliyor
  }
}

// Halka 2 — Maskele
class MaskProcessor extends LogProcessor<IRawLogData, IRawLogData> {
  async process(logs) {
    const masked = logs.map(log => ({ ...log,
      tcNo: this.maskTCKN(log.tcNo),
      creditCard: this.maskCreditCard(log.creditCard),
      email: this.maskEmail(log.email),
      fullName: this.maskFullName(log.fullName),
    }));
    return this.next(masked);
  }
}

// Halka 3 — Zenginleştir
class EnrichProcessor extends LogProcessor<IRawLogData, IProcessedLogData> {
  async process(logs) {
    const enriched = logs.map(log =>
      this.builder.reset(log)
        .setSenderId(this.senderId)           // dinamik IP:port
        .setTransactionNo(randomUUID())       // benzersiz UUID
        .build()
    );
    return this.next(enriched);
  }
}
```

**Zincir kurulumu** (`index.ts`):

```typescript
function createPipeline(senderId: string) {
  const filter = new FilterProcessor();
  const mask   = new MaskProcessor();
  const enrich = new EnrichProcessor(new LogBuilder(), senderId);

  filter.setNext(mask).setNext(enrich);
  return filter; // → filter → mask → enrich
}
```

---

### 3. 🎭 Strategy Pattern

**Dosyalar:** [`middleware/src/strategy/`](middleware/src/strategy/)
**Arayüz:** `IFormatStrategy`

**Problem:** 3 farklı kullanıcı tipi aynı log verisini 3 farklı formatta istiyor. Tek sınıfta `if/else` yazmak Open/Closed ilkesini ihlal eder ve test edilemez kod üretir.

**Çözüm:** Her format için `IFormatStrategy` arayüzünü uygulayan bağımsız bir strateji sınıfı.

```typescript
interface IFormatStrategy {
  format(logs: IProcessedLogData[]): string;
  getFormatType(): OutputFormat;
}

// SYSTEM_ADMIN için — CRITICAL satırları kırmızı, XSS korumalı HTML tablo
class HtmlStrategy implements IFormatStrategy {
  private escapeHtml(v: string): string {
    return v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  format(logs): string { /* HTML tablo üretir */ }
}

// CYBERSEC için — Noktalı virgül ayraçlı, SIEM uyumlu CSV
class CsvStrategy implements IFormatStrategy {
  format(logs): string {
    return logs.map(l => [l.timestamp, l.level, l.fullName, ...].join(';')).join('\n');
  }
}

// WEB_DEV için — Pretty-print JSON
class JsonStrategy implements IFormatStrategy {
  format(logs): string { return JSON.stringify(logs, null, 2); }
}
```

---

### 4. 🏭 Factory Method Pattern

**Dosya:** [`middleware/src/factory/formatterFactory.ts`](middleware/src/factory/formatterFactory.ts)
**Arayüz:** `IFormatterFactory`

**Problem:** `server.ts`'in `new HtmlStrategy()`, `new CsvStrategy()` gibi somut sınıflara doğrudan bağımlı olması Open/Closed ilkesini ihlal eder.

**Çözüm:** `switch-case` yerine **Registry (Kayıt Haritası)** tabanlı fabrika. Yeni rol eklemek için fabrika kodu değiştirilmez.

```typescript
class FormatterFactory implements IFormatterFactory {
  private registry = new Map<UserRole, () => IFormatStrategy>();

  register(role: UserRole, creator: () => IFormatStrategy): void {
    this.registry.set(role, creator);
  }

  createFormatter(role: UserRole): IFormatStrategy {
    const creator = this.registry.get(role);
    if (!creator) throw new Error(`No strategy for: ${role}`);
    return creator();
  }
}

// Fabrika kurulumu
function initializeFormatterFactory(): FormatterFactory {
  const f = new FormatterFactory();
  f.register(UserRole.SYSTEM_ADMIN, () => new HtmlStrategy());
  f.register(UserRole.CYBERSEC,     () => new CsvStrategy());
  f.register(UserRole.WEB_DEV,      () => new JsonStrategy());
  return f;
}
```

**Kullanım** (`server.ts`):

```typescript
// server.ts hiçbir somut strateji sınıfını import etmez
const formatter = this.formatterFactory.createFormatter(UserRole.SYSTEM_ADMIN);
const output    = formatter.format(this.allProcessedLogs);
console.log(`[Middleware] Updated ${formatter.getFormatType()} output.`);
// → "Updated HTML output."
```

---

## 📐 SOLID Prensipleri

| Prensip | Uygulanışı |
|---|---|
| **SRP** — Tek Sorumluluk | `TCPChunkAdapter` sadece ayrıştırır, `MaskProcessor` sadece maskeler, `CsvStrategy` sadece CSV üretir. Log rotasyonu ise Node.js'e değil ayrı bir `log-rotator` sidecar'ına devredilmiştir. |
| **OCP** — Açık/Kapalı | Registry tabanlı fabrika sayesinde yeni bir çıktı formatı eklemek için mevcut kod değiştirilmez; sadece yeni bir `Strategy` sınıfı yazılıp haritaya kaydedilir. CoR zinciri de yeni halka eklenmesine izin verir. |
| **LSP** — Liskov Yerine Geçme | Tüm strateji sınıfları `IFormatStrategy`'yi uygular. Fabrikadan dönen herhangi bir strateji, diğerinin yerine geçebilir. |
| **ISP** — Arayüz Ayrımı | `shared/interfaces.ts`'teki arayüzler küçük ve odaklıdır. Hiçbir sınıf kullanmadığı bir metodu implement etmek zorunda kalmaz. |
| **DIP** — Bağımlılık Tersine Çevirme | `LogTCPServer`, somut pipeline sınıflarını değil `PipelineFactory` fonksiyonunu alır. Tüm bağımlılıklar `ILogProcessor` ve `IFormatStrategy` arayüzleri üzerinden enjekte edilir. |

---

## ⚡ Performans ve Backpressure

### Gerçek Zamanlı Metrikler

Her 1 saniyede bir konsola şu metrikler yazdırılır:

```
[Performance Metrics] Total Processed: 74000 logs | Speed: 812.34 logs/sec |
Avg Batch Latency: 1.43ms | RAM Heap: 27.12 MB | Queue Size: 0
```

| Metrik | Açıklama |
|---|---|
| `Total Processed` | Oturum başından beri işlenen toplam log |
| `Speed` | Saniyedeki anlık işlem hızı (logs/sec) |
| `Avg Batch Latency` | 1.000 logluk bir paketin CoR zincirinden geçiş süresi (ms) |
| `RAM Heap` | Node.js V8 heap bellek kullanımı (MB) |
| `Queue Size` | Kuyrukta bekleyen anlık log sayısı |

### Watermark Tabanlı Backpressure

```
                              Producer hızı > Middleware kapasitesi
                                             │
Kuyruk ≥ 10.000 (High Watermark) ──────────►  socket.pause()
                                             │  Üretim durur
              Kuyruk boşalıyor...            │
                                             │
Kuyruk ≤ 2.000 (Low Watermark) ─────────────►  socket.resume()
                                             │  Üretim devam eder
```

**Producer tarafı** — `socket.write()` `false` döndürdüğünde (TCP tamponu dolu) log üretimi durur, `drain` eventi tetiklendiğinde devam eder.

### Ölçülen Performans Değerleri

| Senaryo | Throughput | Latency | RAM |
|---|---|---|---|
| Normal yük (5K log/sn ham) | ~700–800 logs/sec işlendi | < 2.5ms | ~25–30 MB |
| Stres testi (1M log/sn ham) | **40.000–65.000 logs/sec** | 5–15ms | 45–55 MB (sabit) |

---

## 🔄 Log Rotasyonu

`cybersec.csv` dosyasının kontrolsüz büyümesini engellemek için Docker Compose'a `log-rotator` adlı Alpine Linux sidecar container'ı eklenmiştir.

```
cybersec.csv boyutu ≥ 5 MB
        │
        ▼
cybersec.3.csv  ← silinir (en eski)
cybersec.2.csv  → cybersec.3.csv
cybersec.1.csv  → cybersec.2.csv
cybersec.csv    → cybersec.1.csv
[yeni boş]      → cybersec.csv  (başlık satırıyla)
```

- Maksimum **4 dosya** tutulur
- Toplam disk kullanımı **≤ 20 MB** ile sınırlıdır
- Her **5 saniyede** bir kontrol edilir

---

## 📅 Geliştirme Süreci

Proje agentic (temsilci tabanlı) geliştirme yaklaşımıyla 4 sprint'te tamamlanmıştır.

### Sprint 1 — Mimari Planlama ve Altyapı *(23 Mayıs 2026)*
- Ödev analizi ve kural belirleme (`docs/rules.md`)
- TypeScript proje yapısının tasarlanması (`shared/`, `producer/`, `middleware/`)
- Ortak veri tipleri ve 4 tasarım kalıbının arayüzleri kodlandı (`shared/interfaces.ts`)
- Docker Compose altyapısı ve bridge network tanımlandı
- Git deposu başlatıldı ve GitHub'a bağlandı

### Sprint 2 — Bileşen Tasarımı ve Doğrulama *(23 Mayıs 2026)*
- Producer veri şeması tasarlandı: `faker.js` + TCKN checksum algoritması + NDJSON protokolü
- Middleware bileşenleri tasarlandı: TCP server mimarisi, Watermark Queue (10k/2k), CoR hiyerarşisi, Registry-based Factory
- Tasarımlar Validator Agent tarafından SOLID ve performans kriterleri açısından denetlendi ve onaylandı

### Sprint 3 — Kodlama, Entegrasyon ve Testler *(23 Mayıs 2026)*
- Producer: `generator.ts` (TCKN algoritmalı veri üretici), `client.ts` (backpressure uyumlu TCP client)
- Middleware: `chunkAdapter.ts`, `FilterProcessor`, `MaskProcessor`, `EnrichProcessor`, `LogBuilder`, 3 strateji sınıfı, `FormatterFactory`, `server.ts`
- 16 entegrasyon testi `scratch/run_validation_tests.ts` ile çalıştırıldı, tamamı geçti
- KVKK maskeleme sızıntı denetimi yapıldı

### Post-Sprint — Hata Giderme ve Optimizasyon *(23–25 Mayıs 2026)*
- `log-rotator` sidecar container eklendi, rotasyon doğrulandı
- Docker Compose `$$size` değişken kaçışı hatası düzeltildi
- OUTPUT_DIR yol uyuşmazlığı giderildi

### Post-Sprint 2 — Kod Kalitesi ve Güvenlik *(25 Mayıs 2026)*
- **HTML/JSON overwrite sorunu:** `allProcessedLogs[]` akümülatörü eklendi — tüm oturum logları birikimli yansıtılıyor
- **Dinamik senderId:** Her TCP bağlantısı için soketin `IP:port` adresi senderId olarak kullanılıyor
- **XSS koruması:** `HtmlStrategy`'ye `escapeHtml()` eklendi
- **`LogBuilder` null guard:** `build()` öncesi `reset()` çağrılmadıysa anlaşılır hata fırlatılıyor
- **`getFormatType()` aktif kullanım:** Dışa aktarım log mesajlarında kullanılarak ölü kod olmaktan çıkarıldı

---

## 📁 Proje Yapısı

```
yazilimmuhproje/
├── docker-compose.yml          # 3 servis: middleware, producer, log-rotator
├── shared/
│   ├── types.ts                # LogLevel, UserRole, IRawLogData, IProcessedLogData
│   └── interfaces.ts           # ITCPChunkAdapter, ILogProcessor, IFormatStrategy, IFormatterFactory
├── producer/
│   └── src/
│       ├── generator.ts        # faker.js + TCKN algoritması + ağırlıklı log senaryoları
│       ├── client.ts           # TCP client + backpressure (drain event)
│       └── index.ts            # Giriş noktası
├── middleware/
│   └── src/
│       ├── server.ts           # TCP server + Watermark queue + performans metrikleri
│       ├── index.ts            # Pipeline factory + servis başlatma
│       ├── adapter/
│       │   └── chunkAdapter.ts     # [ADAPTER] Buffer → IRawLogData[]
│       ├── pipeline/
│       │   ├── logProcessor.ts     # [CoR] Soyut taban
│       │   ├── filterProcessor.ts  # [CoR] INFO/WARN eleme
│       │   ├── maskProcessor.ts    # [CoR] KVKK maskeleme
│       │   └── enrichProcessor.ts  # [CoR] senderId + UUID zenginleştirme
│       ├── builder/
│       │   └── logBuilder.ts       # LogBuilder (EnrichProcessor içinde kullanılır)
│       ├── strategy/
│       │   ├── htmlStrategy.ts     # [STRATEGY] XSS korumalı HTML tablo
│       │   ├── csvStrategy.ts      # [STRATEGY] Noktalı virgül CSV
│       │   └── jsonStrategy.ts     # [STRATEGY] Pretty JSON
│       └── factory/
│           └── formatterFactory.ts # [FACTORY] Registry tabanlı strateji üretici
└── docs/
    ├── rules.md                # Proje anayasası
    ├── architecture_design.md  # Mimari tasarım belgesi
    ├── producer_design.md      # Producer algoritma dokümantasyonu
    └── middleware_design.md    # Middleware tasarım dokümantasyonu
```

---

## 🛠️ Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı |
|---|---|
| **TypeScript** | Tip güvenlikli uygulama geliştirme |
| **Node.js `net` modülü** | Raw TCP soket iletişimi |
| **Docker / Docker Compose** | Konteynerleştirme ve çoklu servis yönetimi |
| **faker.js** | Gerçekçi log verisi üretimi |
| **crypto (Node.js built-in)** | UUID (transactionNo) üretimi |
| **Alpine Linux** | Log rotasyonu sidecar container'ı |

---

*CENG302 Yazılım Mühendisliği — Dönem Sonu Projesi*
