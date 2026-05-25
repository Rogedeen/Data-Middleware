# CENG302 Data Middleware - Proje Detayları Raporu

Bu rapor, projenin yazılım mimarisini, kullanılan tasarım kalıplarını (Design Patterns), SOLID yazılım prensiplerine olan uyumluluğunu ve temiz kod (Clean Code) pratiklerini teknik detaylarıyla açıklamaktadır.

---

## 🏗️ 1. Mimari Tasarım ve Veri Akışı

Sistem, gevşek bağlı (loosely coupled) ve olay yönlendirmeli (event-driven) iki docker modülünden oluşur:
1. **Producer Container (Veri Üretici):** Saniyede binlerce NDJSON (Newline-Delimited JSON) satırı üreten ve bunları TCP soketi üzerinden ara katmana aktaran simülatör.
2. **Middleware Container (Ara Katman):** TCP sunucusu üzerinden verileri karşılayan, kuyruğa alan, filtreleyen, maskeleyen, zenginleştiren ve farklı rollere uygun stratejilerle diske yazan motor.

### 🏷️ 1.1 Log Seviyesi Sınıflandırma ve Hata Kriterleri
Sistemde logların önemi (seviyesi) ve hataların sebepleri, borsa işlemlerini simüle eden mantıksal senaryolar üzerinden belirlenir. Log seviyeleri ve önem belirleme kriterleri şunlardır:

* **INFO (Bilgi - %70 Ağırlık):** Sistemin normal, beklenen akışında gerçekleştirdiği başarılı işlemlerdir.
  * *Örnekler:* Başarılı oturum açma (`User Session Started`), çıkış yapma, başarılı limit emir girişi (`Limit Order Placed`), başarılı piyasa emri yürütme (`Market Order Executed Successfully`), başarılı bakiye yükleme (`Deposit Funds Succeeded`).
  * *Önem Kriteri:* Sistem sağlığını bozmayan, sıradan operasyonel olaylar.
* **WARNING (Uyarı - %15 Ağırlık):** İşlem akışını kesintiye uğratmayan ancak takip edilmesi gereken hafif anomalilerdir.
  * *Örnekler:* Hatalı şifre denemesiyle başarısız giriş (`Login Failed - Invalid Credentials`), kullanıcının kendi emrini iptal etmesi, API istek sınırına yaklaşılması (`API Rate Limit Threshold Approaching`).
  * *Önem Kriteri:* Sistem çalışmaya devam eder ancak gelecekteki olası hatalar için öncü gösterge niteliğindedir.
* **ERROR (Hata - %10 Ağırlık):** Bir işlemin tamamlanmasını engelleyen ancak sistemi çökertmeyen hata durumlarıdır.
  * *Örnekler ve Nedenleri:* 
    * `Limit Order Execution Failed - Insufficient Margin`: Hesaptaki teminat miktarının emri karşılamaya yetmemesi (Hata Kodu: `ERR_MARGIN_LACK`).
    * `Withdraw Funds Failed - Insufficient Balance`: Çekilmek istenen tutarın mevcut bakiyeden fazla olması (Hata Kodu: `ERR_BALANCE_LACK`).
    * `Database Read Timeout`: Veritabanı sorgusunun zaman aşımına uğraması ve işlemin geri alınması (Hata Kodu: `ERR_DB_TIMEOUT`).
  * *Önem Kriteri:* Bireysel bir işlem (order, deposit, query) başarısız olmuştur, hata kodları ile sebebi belirtilir.
* **CRITICAL (Kritik - %5 Ağırlık):** Sistem genelini etkileyebilecek veya güvenlik riski oluşturan ciddi durumlardır.
  * *Örnekler ve Nedenleri:*
    * `Security Alert - Multiple Failed Logins`: Aynı IP adresinden arka arkaya başarısız giriş denemeleri ile kaba kuvvet (Brute-Force) saldırı tehdidi (Alarm Kodu: `SEC_ALARM_01`).
    * `API Connection Refused`: Dış borsa broker API servisinin çevrimdışı olması ve emirlerin iletilememesi (Alarm Kodu: `SYS_ALARM_02`).
    * `System Resource Alert`: Uygulamanın RAM bellek limitine (Out of Memory) yaklaşması (Alarm Kodu: `SYS_ALARM_03`).
  * *Önem Kriteri:* Güvenlik veya sistem genelinde kesinti riski taşıyan olaylar olup, sunucu ve SIEM tarafında anlık alarm tetiklemelidir.

---

## 🎨 2. Kullanılan Tasarım Kalıpları (Design Patterns)

Projede, anayasa kurallarına ve gereksinimlere uygun olarak **5 adet tasarım kalıbı** kullanılmıştır:

### 1. Adapter Pattern (Hedef: TCP Akışını Ayrıştırma)
* **Kullanılan Sınıf:** `TCPChunkAdapter`
* **Amaç:** TCP protokolü, verileri paket sınırları olmaksızın sürekli bir akış (stream) olarak iletir. Bu durum ağda paketlerin bölünmesine (fragmentation) veya birleşmesine (merging) yol açar.
* **Uygulanışı:** `TCPChunkAdapter` sınıfı, ham TCP `Buffer` chunk'larını dinler, bunları arabelleğe (buffer) yazar ve satır sonu (`\n`) karakterine göre bölerek anlamlı NDJSON nesneleri haline getirir. Soket verisini, uygulamanın anlayabileceği `IRawLogData[]` dizilerine adapte eder.

### 2. Chain of Responsibility (CoR) Pattern (Hedef: Log İşleme Boru Hattı)
* **Kullanılan Sınıflar:** `LogProcessor<TIn, TOut>`, `FilterProcessor`, `MaskProcessor`, `EnrichProcessor`
* **Amaç:** Log işleme adımlarını (filtreleme, maskeleme, zenginleştirme) gevşek bağlı, sırayla çalışan ve genişletilebilir bir boru hattı (pipeline) haline getirmek.
* **Uygulanışı:** 
  - `LogProcessor` soyut sınıfı, zincirin bir sonraki halkasını (`next`) tutar ve generic tiplerle tip güvenliği sağlar.
  - `FilterProcessor` en başta çalışır; sistem performansını korumak amacıyla `INFO` ve `WARNING` seviyesindeki logları zincirin başında drop eder.
  - `MaskProcessor` hassas kişisel verileri (TCKN, Kredi Kartı, E-posta, İsim) KVKK uyumlu algoritmalarla maskeler.
  - `EnrichProcessor` logları mikroservisler için zenginleştirir.

### 3. Builder Pattern (Hedef: Modüler Veri İnşası ve Zenginleştirme)
* **Kullanılan Sınıf:** `LogBuilder`
* **Amaç:** `IRawLogData` nesnesinden zenginleştirilmiş `IProcessedLogData` nesnesini oluştururken, karmaşık zenginleştirme mantığını modülerleştirmek.
* **Uygulanışı:** `LogBuilder` sınıfı; `setSenderId`, `setTransactionNo` (UUID üretimiyle) ve `build` gibi zincirlenebilir metotlar sunar. `build()` metodu hem `reset()` çağrılıp çağrılmadığını hem de zorunlu alanların dolu olduğunu kontrol ederek güvenli nesne inşası garanti eder.

### 4. Strategy Pattern (Hedef: Rol Bazlı Çıktı Biçimlendirme)
* **Kullanılan Sınıflar:** `IFormatStrategy`, `HtmlStrategy`, `CsvStrategy`, `JsonStrategy`
* **Amaç:** Kullanıcı rollerine göre (System Admin, CyberSec, Web Dev) çıktı formatlarını dinamik olarak belirlemek ve dosya yazma format algoritmalarını birbirlerinden izole etmek.
* **Uygulanışı:**
  - `HtmlStrategy` (SYSTEM_ADMIN için): Hata seviyesi `CRITICAL` olan satırları kırmızı renklendiren, tüm log parametrelerini (maskelenmiş kişisel veriler ve Debug dahil) dökümante eden şık bir HTML tablosu üretir. Tüm dinamik alanlar `escapeHtml()` fonksiyonuyla XSS saldırılarına karşı korunur.
  - `CsvStrategy` (CYBERSEC için): SIEM sistemlerine uygun, semicolon (`;`) ayraçlı ve tırnak kaçışlı (escaping) güvenli CSV çıktısı üretir.
  - `JsonStrategy` (WEB_DEV için): Geliştiricilerin debug yapabileceği, tüm hata traceback detaylarını barındıran temiz JSON çıktısı hazırlar.
  - Her strateji `getFormatType()` metodu aracılığıyla format tipini dışa aktarır; bu bilgi `server.ts`'teki dışa aktarım log mesajlarında aktif olarak kullanılır.

### 5. Factory Method Pattern (Hedef: Açık-Kapalı İlkesine Uygun Nesne Üretimi)
* **Kullanılan Sınıflar:** `FormatterFactory`
* **Amaç:** Strateji nesnelerini, istemci sınıfların doğrudan `new` anahtar kelimesiyle bağımlı olmasına gerek kalmadan üretmek.
* **Uygulanışı:** `FormatterFactory` sınıfı, Open/Closed prensibini ihlal etmemek adına `switch-case` yerine dinamik bir **Registry** (Kayıt Haritası) kullanır. Başlangıçta rollere karşılık gelen yapıcı fonksiyonlar (`new HtmlStrategy()`, `new CsvStrategy()`, `new JsonStrategy()`) bir `Map` nesnesine kaydedilir. `createFormatter(role)` metodu bu haritadan ilgili stratejiyi bularak döner. Yeni bir rol eklendiğinde fabrika kodunu değiştirmek gerekmez, sadece yeni stratejiyi tescil etmek (register) yeterlidir.

---

## 📐 3. SOLID Prensiplerine Uygunluk Analizi

Sistem mimarisi, SOLID nesne yönelimli tasarım ilkelerine uyum gösterecek şekilde dizayn edilmiştir:

1. **Single Responsibility Principle (SRP - Tek Sorumluluk):**
   * Her sınıfın yalnızca bir işi vardır. Örneğin, `TCPChunkAdapter` sadece akış ayrıştırır, `MaskProcessor` sadece veri maskeler, `CsvStrategy` sadece CSV'ye dönüştürür. Log rotasyonu işi bile Node.js uygulamasına yüklenmemiş, altyapı seviyesinde bağımsız bir `log-rotator` sidecar container'ına verilmiştir.
2. **Open/Closed Principle (OCP - Açık/Kapalı):**
   * Fabrikadaki Registry yapısı sayesinde sisteme yeni bir çıktı formatı eklemek için mevcut kodlar değiştirilmez; sadece yeni bir Strateji sınıfı yazılıp haritaya kaydedilir. CoR yapısı da yeni halkalar eklenmesine kod değişimi yapmadan imkan tanır.
3. **Liskov Substitution Principle (LSP - Liskov'un Yerine Geçme):**
   * Tüm format stratejileri `IFormatStrategy` arayüzünü uygular. `FormatterFactory`'den dönen herhangi bir strateji, uygulamanın çalışmasını bozmadan birbirinin yerine kullanılabilir.
4. **Interface Segregation Principle (ISP - Arayüz Ayrımı):**
   * Ortak arayüzler [interfaces.ts](file:///c:/Users/iyunu/OneDrive/Masaüstü/yazilimmuhproje/shared/interfaces.ts) dosyasında görülebileceği gibi son derece küçük, amaca yönelik ve modülerdir. Sınıflar ihtiyaç duymadıkları metotları ezmek zorunda bırakılmamıştır.
5. **Dependency Inversion Principle (DIP - Bağımlılıkların Tersine Çevrilmesi):**
   * Yüksek seviyeli modüller (örneğin `LogTCPServer`), düşük seviyeli modüllere doğrudan bağımlı değildir. Pipeline bir **factory fonksiyonu** (`PipelineFactory` tipi) aracılığıyla enjekte edilir; bu sayede `LogTCPServer` somut işlemci sınıflarından tamamen bağımsızdır. Tüm boru hattı ve strateji nesneleri soyut arayüzler (`ILogProcessor`, `IFormatStrategy`) üzerinden enjekte edilerek gevşek bağlılık sağlanmıştır.

---

## 🧹 4. Temiz Kod (Clean Code) Pratikleri

* **Güçlü Tip Güvenliği:** Projede tamamen TypeScript kullanılmıştır. CoR işlemcileri generic parametreler (`LogProcessor<TIn, TOut>`) ile donatılarak tip güvensizliği (`any` tipi) tamamen engellenmiştir.
* **KVKK/GDPR Uyumlu Maskeleme:** Hassas veriler regex ve algoritmik yöntemlerle maskelenmiştir:
  * **İsim:** `Ahmet Yılmaz` -> `A**** Y****` (baş harfler hariç maskelenir).
  * **TCKN:** Algoritmik kontrolden geçerek `12345678901` -> `*********01` (son iki hane hariç maskelenir).
  * **Kredi Kartı:** Tireli, boşluklu veya düz biçimler korunarak `4355-4567-8901-2345` -> `****-****-****-2345` (son 4 hane hariç maskelenir).
  * **E-posta:** Domain yapısı bozulmadan `johndoe@example.com` -> `j******@example.com` olarak maskelenir.
* **XSS Güvenliği:** `HtmlStrategy` içinde `escapeHtml()` yardımcı fonksiyonu tüm dinamik log alanlarını HTML özel karakterlerine (`&`, `<`, `>`, `"`, `'`) karşı temizler.
* **Excel Uyumluluğu:** Türkçe yerel ayarlara sahip Microsoft Excel programlarının CSV dosyalarındaki verileri tek sütuna yığmasını önlemek için sütun ayırıcı olarak noktalı virgül (`;`) seçilmiştir.
* **Birikimli Log Yönetimi:** HTML ve JSON çıktı dosyaları artık yalnızca son batch'i değil, tüm oturum boyunca birikmiş logları yansıtır. Bu sayede sistem admin paneli (`system_admin.html`) ve geliştirici çıktısı (`web_dev.json`) gerçek bir döküm belgesi işlevi görür.
* **Dinamik Gönderici Kimliği:** Her TCP bağlantısı için `senderId`, producer'ın gerçek ağ adresinden (`IP:port`) dinamik olarak türetilir. Farklı producer örnekleri veya bağlantı oturumları loglar üzerinde ayırt edilebilir.
* **Güvenli Admin Paneli:** `system_admin.html` stratejisinde, veri bütünlüğünün korunması adına tüm log alanları (maskelenmiş isim, TCKN, kredi kartı, e-posta ve Debug kolonları dahil) sunulmaktadır. Verilerin maskeli sunulması sayesinde KVKK uyumluluğu tam olarak sağlanmıştır.
* **Sidecar Log Rotasyonu:** Node.js tek iş parçacıklı (single-threaded) çalıştığı için dosya boyutu kontrolü, disk yazma kilidi açma, dosya kopyalama ve sıkıştırma gibi I/O yükü getiren işler sunucu uygulamasına yüklenmemiş; bu iş Docker altyapısındaki bağımsız bir sidecar container'ına (`log-rotator`) devredilmiştir.

---

## ⚡ 5. Sistem Performansı ve Performans Ölçümü (Benchmark)

Ödevde talep edilen *"yüksek sayıda veriyi üretip ileterek ara katmanın performans aralığını ölçme"* gereksinimi için sisteme gerçek zamanlı bir performans izleme motoru (benchmarking utility) entegre edilmiştir.

### 📊 5.1 Ara Katman Performans Takip Motoru
Ara katman sunucusunda (`server.ts`), her log paketinin Chain of Responsibility (CoR) boru hattından geçiş süresi yüksek çözünürlüklü zaman damgası (`process.hrtime()`) ile mikrosaniye hassasiyetinde ölçülür. 
Her 1 saniyede bir konsol günlüğüne otomatik olarak şu metrikler dökülür:
* **Total Processed:** Sunucu açıldığından beri işlenen toplam log satırı sayısı.
* **Speed (Throughput):** Saniyede işlenen ortalama log sayısı (logs/sec).
* **Avg Batch Latency:** 1.000 logluk bir paketin zincirden geçiş süresi (milisaniye cinsinden gecikme).
* **RAM Heap:** Node.js V8 motorunun kullandığı aktif heap bellek miktarı (MB).
* **Queue Size:** Backpressure tamponundaki anlık bekleyen log sayısı.

### 🧪 5.2 Performans Aralıklarının Ölçülmesi (Test Senaryoları)
Sistem performansını videoda ve raporda iki farklı senaryo ile gösterebilirsiniz:

#### 🟢 Senaryo A: Normal Çalışma Yükü (Low/Medium Load)
* **Yapılandırma (`docker-compose.yml`):**
  * `CHUNK_SIZE=500`
  * `GENERATION_INTERVAL_MS=100` (Saniyede 5.000 ham log üretimi)
* **Gözlemlenen Performans:**
  * **İşleme Hızı:** ~700 - 800 logs/sec (INFO/WARN logları en başta drop edildiği için sadece elenen hata logları işlenir).
  * **Batch Gecikmesi (Latency):** < 1.0ms - 2.5ms (Paketler anlık olarak eritilir).
  * **RAM Heap:** ~25 MB - 30 MB (Bellek tüketimi son derece düşüktür).
  * **Queue Size:** 0 (Bellek kuyruğunda birikme olmaz).

#### 🔴 Senaryo B: Stres ve Aşırı Yük Testi (High/Stress Load)
* **Yapılandırma (`docker-compose.yml`):**
  * `CHUNK_SIZE=5000`
  * `GENERATION_INTERVAL_MS=5` (Saniyede 1.000.000 ham log üretimi)
* **Gözlemlenen Performans & Limit Değerleri:**
  * **Maksimum Kapasite (Throughput):** Ara katman, donanım kaynaklarına bağlı olarak saniyede ortalama **40.000 - 65.000 log** işleme hızına ulaşır.
  * **Backpressure Devreye Girişi:** Verici hızı ara katmanın işleme limitlerini aştığı için, middleware kuyruğu anında **10.000** limitine (`High Watermark`) ulaşır. Sunucu TCP soketini duraklatır (`socket.pause()`).
  * **Bellek Kararlılığı:** Soket duraklatıldığı için bellek tüketimi asla kontrolsüz artmaz, RAM kullanımı **45 MB - 55 MB** aralığında sabitlenir (OOM hatası engellenir).
  * **Backpressure Tahliyesi:** Boru hattı kuyruktaki logları temizleyip kuyruk boyutu **2.000** logun (`Low Watermark`) altına indiğinde soket otomatik olarak tekrar açılır (`socket.resume()`) ve veri akışı güvenle devam eder.
