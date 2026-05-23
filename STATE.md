# CENG302 - Data Middleware Proje Durumu (State Tracking)

## Proje Hakkında
Bu dosya, CENG302 Data Middleware projesinin Agentic Development yaklaşımı ile geliştirilmesi sürecinde tamamlanan (DONE) ve yapılacak (TODO) görevlerin durumunu takip etmek amacıyla Orchestrator Agent tarafından güncellenmektedir.

---

## 🏃 SPRINT 2: Bileşen Tasarımları ve Algoritma Akışları (Tamamlandı)

### ✅ DONE (Tamamlananlar Listesi)
- [x] **GÖREV 1.6 (Producer):** `faker.js` ile üretilecek ham log verilerinin JSON yapısının (modelinin) tasarlanması. (Bkz: [docs/producer_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/producer_design.md))
- [x] **GÖREV 1.7 (Producer):** TCP Socket client üzerinden chunk veri gönderimi akış diyagramının ve algoritmasının tasarlanması. (Bkz: [docs/producer_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/producer_design.md))
- [x] **GÖREV 1.8 (Producer):** Yüksek performanslı yük testleri için veri üretim döngü hızlarının (backpressure uyumlu) planlanması. (Bkz: [docs/producer_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/producer_design.md))
- [x] **GÖREV 1.9 (Middleware):** TCP Socket sunucu mimarisinin ve backpressure (pause/resume) mekanizmasının tasarlanması. (Bkz: [docs/middleware_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/middleware_design.md))
- [x] **GÖREV 1.10 (Middleware):** Chain of Responsibility (CoR) filtreleme, maskeleme (güvenlik) ve Builder entegrasyon adımlarının akış sırasının belirlenmesi. (Bkz: [docs/middleware_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/middleware_design.md))
- [x] **GÖREV 1.11 (Middleware):** Rol bazlı format çıktı üretimi (HTML, CSV, JSON) için Strategy ve Factory sınıflarının şematik tasarımı. (Bkz: [docs/middleware_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/middleware_design.md))
- [x] **GÖREV 1.15 (Validator):** Tasarımların rules.md kuralları, SOLID ve performans kriterleri doğrultusunda denetlenmesi ve nihai onay. (Bkz: [validation_report.md](file:///C:/Users/iyunu/.gemini/antigravity/brain/f0801f50-e2f2-4990-94fe-9e40c0e68d1b/validation_report.md))

---

## 🏃 SPRINT 3: Kodlama ve Entegrasyon (Sıradaki Aşama)

Sprint 3'ün amacı, onaylanmış detaylı tasarımları ve algoritmaları TypeScript dilinde kodlamak, Docker ortamını ayağa kaldırmak ve entegrasyonu tamamlamaktır.

### 📋 TODO (Yapılacaklar Listesi)

#### 📡 Producer Modülü Geliştirilmesi (Producer Agent veya Geliştirici)
- [ ] **GÖREV 2.1:** `faker.js` veri üretici motorunun (`generator.ts`) kodlanması.
- [ ] **GÖREV 2.2:** Backpressure ve NDJSON uyumlu TCP Socket client (`client.ts`) kodlanması.
- [ ] **GÖREV 2.3:** Producer giriş noktası (`index.ts`) entegrasyonu.

#### 🧠 Middleware Modülü Geliştirilmesi (Middleware Agent veya Geliştirici)
- [ ] **GÖREV 2.4:** `TCPChunkAdapter` buffer frame ayrıştırıcısının kodlanması.
- [ ] **GÖREV 2.5:** Generic tip uyumlu Chain of Responsibility (CoR) işlemcilerinin (`Filter`, `Mask`, `Enrich`) kodlanması.
- [ ] **GÖREV 2.6:** `LogBuilder` zenginleştirme sınıfının kodlanması.
- [ ] **GÖREV 2.7:** Çıktı format stratejilerinin (`HTML`, `CSV`, `JSON`) ve registry-based `FormatterFactory` sınıfının kodlanması.
- [ ] **GÖREV 2.8:** Watermark Queue-based backpressure mekanizmasını içeren TCP Sunucusunun (`server.ts`) ve giriş noktasının (`index.ts`) kodlanması.

#### 🐳 Entegrasyon ve Dağıtım (Orchestrator)
- [ ] **GÖREV 2.9:** `docker-compose` yapılandırmasının test edilmesi ve servislerin ayağa kaldırılması.

#### 🔍 Doğrulama ve Testler (Validator Agent)
- [ ] **GÖREV 2.10:** Maskeleme (TCKN, Kredi Kartı, E-posta) leak-proof güvenlik testlerinin çalıştırılması.
- [ ] **GÖREV 2.11:** Yüksek saniyede log sayısı ve RAM kullanım performansı (Filtreleme etkisi) profil testlerinin çalıştırılması ve metriklerin çıkarılması.
