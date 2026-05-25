# CENG302 Data Middleware - Süreç Raporu

Bu rapor, projenin başından sonuna kadar olan agentic (temsilci tabanlı) yazılım geliştirme sürecini, atılan adımları, sprint planlamalarını ve iteratif hata çözümlerini dökümante etmektedir.

---

## 📅 1. Geliştirme Süreci ve Zaman Çizelgesi (Sprint Milestones)

Proje, 3 ana sprint ve 1 hata giderme/sistem sıkılaştırma (post-sprint) aşamasından oluşacak şekilde planlanmış ve başarıyla tamamlanmıştır.

### 🏁 Sprint 1: Altyapı, Arayüzler ve Mimarinin Tasarlanması (23 Mayıs 2026 - 21:18)
* **Gereksinim Analizi:** Dönem ödevi belgesi (`project_details.md`) ve projenin anayasası olan `rules.md` analiz edildi. Zorunlu kılınan 5 tasarım kalıbı (Adapter, Chain of Responsibility, Builder, Strategy, Factory Method) ve TCP soket/chunk gereksinimleri listelendi.
* **Depo & Dizin Kurulumu:** Proje dizini (`yazilimmuhproje`) oluşturuldu, git deposu başlatıldı ve uzak repo adresi (`https://github.com/Rogedeen/Data-Middleware.git`) tanımlandı.
* **Arayüzlerin Kodlanması (`shared/`):** 
  * [types.ts](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/shared/types.ts): `LogLevel`, `UserRole`, `OutputFormat` gibi veri modelleri ve enum yapıları tanımlandı.
  * [interfaces.ts](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/shared/interfaces.ts): Tasarım kalıplarının arayüzleri TypeScript standardında belirlendi.
* **Konteyner Altyapısı:** `producer` ve `middleware` modülleri için Dockerfile'lar ve bunları birbirine bağlayan `docker-compose.yml` köprü ağı tanımlandı.
* **Mimari Taslak:** `docs/architecture_design.md` belgesi oluşturuldu.

---

### 🎨 Sprint 2: Bileşenlerin Tasarımı ve Validator Denetimi (23 Mayıs 2026 - 21:26)
* **Data Generator Tasarımı:** Producer Agent tarafından `docs/producer_design.md` hazırlandı. `faker.js` tabanlı log şeması, TCKN üretim algoritması, NDJSON çerçeveleme protokolü ve soket yazma backpressure (geri basınç) akışı dökümante edildi.
* **Middleware Tasarımı:** Middleware Agent tarafından `docs/middleware_design.md` hazırlandı. TCP Server mimarisi, bellek şişmesini önleyen Watermark Queue (10k/2k log sınırları) mekanizması, `Filter -> Mask -> Enrich` CoR hiyerarşisi ve Registry-based Factory deseni UML diyagramlarıyla dökümante edildi.
* **Validator Denetimi (Architecture Audit):** Validator Agent, tasarımları inceledi. TCP soket duraklatmasının kısmi veri paketlerinde kilitlenmeye (deadlock) yol açmaması için watermark queue tabanlı akışı zorunlu kıldı; Factory sınıfının if-else yığınına dönüşmemesi için switch-case yerine Registry haritası kullanılması tavsiyesini vererek tasarımları **APPROVED (Onaylandı)** olarak işaretledi.

---

### 💻 Sprint 3: Kodlama, Entegrasyon ve Canlı Sistem Testleri (23 Mayıs 2026 - 21:35)
* **Kaynak Kodlarının Geliştirilmesi:** Tasarımlara sadık kalınarak TypeScript dilinde kodlama yapıldı.
  * **Producer:** `generator.ts` (TCKN doğrulama algoritması entegre edilmiş veri üretici) ve `client.ts` (soket dolunca üretimi durduran, `drain` olayıyla sürdüren client) yazıldı.
  * **Middleware:** `chunkAdapter.ts` (NDJSON paket birleştirici adaptör), CoR işleyicileri (`FilterProcessor`, `MaskProcessor`, `EnrichProcessor`), `LogBuilder` (veri zenginleştirici) ve formatlama stratejileri (`HtmlStrategy`, `CsvStrategy`, `JsonStrategy`) ile bunları OCP uyumlu üreten `FormatterFactory` ve watermark queue'ya sahip `server.ts` kodlandı.
* **Otomatik Entegrasyon Testleri:** [run_validation_tests.ts](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/scratch/run_validation_tests.ts) yerel test aracı yazıldı. Maskeleme kuralları, filtreleme doğruluğu ve stratejiler dahil 16 entegrasyon testinin tamamı başarıyla geçti.
* **Veri Güvenliği Auditi:** Validator Agent, canlı verileri denetleyerek TCKN, Kredi Kartı, İsim ve E-posta maskelemelerinde KVKK sızıntısı olmadığını doğruladı ve projeye nihai **APPROVED** onayını verdi.

---

### ⚙️ Post-Sprint: Hata Giderme, Disk Sınırlandırma ve Optimizasyon (23 Mayıs 2026 - 22:52)
* **Log Rotasyonu Altyapısı (Sidecar):** `cybersec.csv` dosyasının kontrolsüz büyümesini engellemek için `docker-compose.yml` dosyasına `log-rotator` adında hafif bir alpine container sidecar olarak entegre edildi.
* **Docker Compose Değişken Filtresi Hatası Çözümü:** Compose'un `.yml` içindeki shell değişkeni `$size`'ı host ortam değişkeni olarak yorumlayıp boşaltması sorunu, komuttaki değişkenler `$$size` olarak çift dolar işaretiyle kaçırılarak çözüldü.
* **Yol Uyuşmazlığı (Path Mismatch) Çözümü:** Node.js uygulamasının `npm run start:prod` ile `/app/middleware` dizini altında çalışırken oluşturduğu `/app/middleware/output` dizini ile docker volumes üzerindeki `/app/output` uyuşmazlığı giderildi. Sunucu koduna `process.env.OUTPUT_DIR` desteği eklenip container ortam değişkeni olarak `/app/output` tanımlandı.
* **Rotasyonun Başarıyla Doğrulanması:** Yapılan testlerde dosya boyutu **5 MB** sınırını aştığında eski log dosyalarının silinip kaydırıldığı (`cybersec.csv` -> `cybersec.1.csv` -> `cybersec.2.csv` -> `cybersec.3.csv`) ve yeni temiz bir dosyanın başlıklarla otomatik oluşturulduğu doğrulandı.

---

## 👥 2. Temsilciler (Agents) Arası İşbirliği ve İletişim

Proje, 4 uzman yapay zeka ajanının işbirliğiyle yönetilmiştir:
1. **Orchestrator Agent (Main):** Projeyi yönetti, sprint planlarını oluşturdu, sub-agent'ları koordine etti ve entegrasyonu tamamladı.
2. **Data Generator Agent (Producer):** Log veri şemasını tasarladı, sahte veri üretim mekanizmasını ve soket seviyesindeki backpressure mekanizmasını kurdu.
3. **Middleware Agent:** Log işleme boru hattını (CoR), zenginleştirme (Builder) ve çıktı stratejilerini (Strategy & Registry Factory) tasarladı ve geliştirdi.
4. **Validator & Profiler Agent:** SOLID prensiplerine uygunluğu denetledi, veri sızıntısı kontrollerini gerçekleştirdi ve entegrasyon testlerinin doğruluğunu denetledi.

Her ajan yaptığı çalışmaları kronolojik olarak `docs/agent_logs/` altındaki kendi günlüklerine kaydetmiştir. Bu sayede ekip içi şeffaflık ve dökümantasyon bütünlüğü en üst düzeyde korunmuştur.

---

### 🔧 Post-Sprint 2: Kod Kalitesi ve Güvenlik Denetimi (25 Mayıs 2026 - 23:18)
* **Birikimli Log Yönetimi Düzeltmesi:** HTML ve JSON çıktı dosyalarının her batch'te üstüne yazılması sorunu giderildi. `TCPConnectionHandler` içine `allProcessedLogs[]` akümülatör dizisi eklenerek tüm oturum boyunca biriken logların görünür olması sağlandı.
* **Dinamik Gönderici Kimliği (senderId):** `senderId` değişkeni statik ortam değişkeninden alınmak yerine her yeni TCP bağlantısında soketin gerçek ağ adresinden (`IP:port`) dinamik olarak türetilecek şekilde yeniden tasarlandı. `LogTCPServer`, pipeline yerine `PipelineFactory` fonksiyonu alır hale getirildi.
* **XSS Güvenliği:** `HtmlStrategy` içine `escapeHtml()` yardımcı fonksiyonu eklenerek tüm dinamik log alanları (`message`, `debug`, `fullName` vb.) HTML özel karakterlerine karşı güvene alındı.
* **`maskEmail` Yorum Düzeltmesi:** `MaskProcessor`'daki JSDoc yorumu gerçek maskeleme çıktısıyla uyumlu hale getirildi.
* **`LogBuilder` Null Guard:** `build()` metodu başına `reset()` çağrılmadan çalıştırılması durumunu erken yakalayan savunmacı kontrol eklendi.
* **`getFormatType()` Aktif Kullanım:** Strategy arayüzünde tanımlı `getFormatType()` metodu artık `server.ts`'teki dışa aktarım log mesajlarında kullanılarak ölü kod olmaktan çıkarıldı.
