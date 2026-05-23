# CENG302 - Data Middleware Proje Durumu (State Tracking)

## Proje Hakkında
Bu dosya, CENG302 Data Middleware projesinin Agentic Development yaklaşımı ile geliştirilmesi sürecinde tamamlanan (DONE) ve yapılacak (TODO) görevlerin durumunu takip etmek amacıyla Orchestrator Agent tarafından güncellenmektedir.

---

## 🏃 SPRINT 1: Mimari Planlama, Arayüzlerin Tanımlanması ve Altyapı Tasarımı

Sprint 1'in amacı, projenin temel yapısını kurmak, gerekli tasarım kalıpları için interface ve tipleri oluşturmak, docker konfigürasyonlarını planlamak ve geliştirme ortamını hazırlamaktır. Kod yazımı başlamadan önce mimari plan doğrulanacaktır.

### 📋 TODO (Yapılacaklar Listesi)

#### 🏛️ Mimari & Ortak Altyapı (Orchestrator Agent)
- [ ] **GÖREV 1.1:** TypeScript proje dizin ağacı yapısının (`shared`, `producer`, `middleware`) planlanması ve dökümante edilmesi.
- [ ] **GÖREV 1.2:** `shared/` klasöründe ortak kullanılacak log veri tiplerinin (`ILogData`, `RawLogData`, vb.) tasarlanması.
- [ ] **GÖREV 1.3:** Zorunlu 5 Tasarım Kalıbı için TypeScript Arayüzlerinin (Interface) tanımlanması:
  - `ITCPChunkAdapter` (Adapter Pattern)
  - `ILogProcessor` (Chain of Responsibility Pattern)
  - `ILogBuilder` (Builder Pattern)
  - `IFormatStrategy` (Strategy Pattern)
  - `IFormatterFactory` (Factory Method Pattern)
- [ ] **GÖREV 1.4:** Docker altyapısının (`docker-compose.yml`, `Dockerfile` şablonları) ve servis portlarının (TCP ve log servisleri için) belirlenmesi.
- [ ] **GÖREV 1.5:** GitHub sürüm kontrolü için ilk yapının kurulması ve `main` branch'e push edilmesi.

#### 📡 Veri Üretici Modülü (Producer Agent)
- [ ] **GÖREV 1.6:** `faker.js` ile üretilecek ham log verilerinin JSON yapısının (modelinin) tasarlanması.
- [ ] **GÖREV 1.7:** TCP Socket client üzerinden chunk veri gönderimi akış diyagramının ve algoritmasının tasarlanması.
- [ ] **GÖREV 1.8:** Yüksek performanslı yük testleri için veri üretim döngü hızlarının (backpressure uyumlu) planlanması.

#### 🧠 Ara Katman Yazılımı Modülü (Middleware Agent)
- [ ] **GÖREV 1.9:** TCP Socket sunucu mimarisinin ve backpressure (pause/resume) mekanizmasının tasarlanması.
- [ ] **GÖREV 1.10:** Chain of Responsibility (CoR) filtreleme, maskeleme (güvenlik) ve Builder entegrasyon adımlarının akış sırasının belirlenmesi.
- [ ] **GÖREV 1.11:** Rol bazlı format çıktı üretimi (HTML, CSV, JSON) için Strategy ve Factory sınıflarının şematik tasarımı.

#### 🔍 Doğrulama & Performans (Validator Agent)
- [ ] **GÖREV 1.12:** Güvenlik ve Maskeleme doğruluğunu test edecek Validator test senaryolarının belirlenmesi.
- [ ] **GÖREV 1.13:** Bellek kullanımı ve saniyede işlenen log sayısı (throughput) ölçüm metriklerinin ve profil çıkarma planının tasarlanması.
- [ ] **GÖREV 1.14:** İlk mimari tasarımların rules.md anayasasına uygunluğunun denetlenmesi ve Sprint 1 mimari onayı.

---

### ✅ DONE (Tamamlananlar Listesi)
- [x] **GÖREV 1.0 (Orchestrator):** `rules.md`, `project_details.md` ve tüm ajan direktiflerinin okunması, analiz edilmesi. (Bkz: [docs/rules.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/rules.md))
- [x] **GÖREV 1.0.1 (Orchestrator):** Git sürüm kontrolünün yerel olarak başlatılması ve ilk docs klasörünün commitlenmesi.
