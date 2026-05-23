# CENG302 - Data Middleware Proje Durumu (State Tracking)

## Proje Hakkında
Bu dosya, CENG302 Data Middleware projesinin Agentic Development yaklaşımı ile geliştirilmesi sürecinde tamamlanan (DONE) ve yapılacak (TODO) görevlerin durumunu takip etmek amacıyla Orchestrator Agent tarafından güncellenmektedir.

---

## 🏃 SPRINT 1: Mimari Planlama, Arayüzlerin Tanımlanması ve Altyapı Tasarımı

Sprint 1'in amacı, projenin temel yapısını kurmak, gerekli tasarım kalıpları için interface ve tipleri oluşturmak, docker konfigürasyonlarını planlamak ve geliştirme ortamını hazırlamaktır. Kod yazımı başlamadan önce mimari plan doğrulanacaktır.

### 📋 TODO (Yapılacaklar Listesi)

#### 📡 Veri Üretici Modülü (Producer Agent) - *Sıradaki Adım*
- [ ] **GÖREV 1.6:** `faker.js` ile üretilecek ham log verilerinin JSON yapısının (modelinin) tasarlanması.
- [ ] **GÖREV 1.7:** TCP Socket client üzerinden chunk veri gönderimi akış diyagramının ve algoritmasının tasarlanması.
- [ ] **GÖREV 1.8:** Yüksek performanslı yük testleri için veri üretim döngü hızlarının (backpressure uyumlu) planlanması.

#### 🧠 Ara Katman Yazılımı Modülü (Middleware Agent)
- [ ] **GÖREV 1.9:** TCP Socket sunucu mimarisinin ve backpressure (pause/resume) mekanizmasının tasarlanması.
- [ ] **GÖREV 1.10:** Chain of Responsibility (CoR) filtreleme, maskeleme (güvenlik) ve Builder entegrasyon adımlarının akış sırasının belirlenmesi.
- [ ] **GÖREV 1.11:** Rol bazlı format çıktı üretimi (HTML, CSV, JSON) için Strategy ve Factory sınıflarının şematik tasarımı.

---

### ✅ DONE (Tamamlananlar Listesi)
- [x] **GÖREV 1.0 (Orchestrator):** `rules.md`, `project_details.md` ve tüm ajan direktiflerinin okunması, analiz edilmesi. (Bkz: [docs/rules.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/rules.md))
- [x] **GÖREV 1.0.1 (Orchestrator):** Git sürüm kontrolünün yerel olarak başlatılması ve ilk docs klasörünün commitlenmesi.
- [x] **GÖREV 1.1 (Orchestrator):** TypeScript proje dizin ağacı yapısının (`shared`, `producer`, `middleware`) planlanması ve dökümante edilmesi. (Bkz: [docs/architecture_design.md](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/docs/architecture_design.md))
- [x] **GÖREV 1.2 (Orchestrator):** `shared/` klasöründe ortak kullanılacak log veri tiplerinin (`ILogData`, `RawLogData`, vb.) tasarlanması. (Bkz: [shared/types.ts](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/shared/types.ts))
- [x] **GÖREV 1.3 (Orchestrator):** Zorunlu 5 Tasarım Kalıbı için TypeScript Arayüzlerinin (Interface) tanımlanması. (Bkz: [shared/interfaces.ts](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/yazilimmuhproje/shared/interfaces.ts))
- [x] **GÖREV 1.4 (Orchestrator):** Docker altyapısının (`docker-compose.yml`, `Dockerfile` şablonları) ve servis portlarının belirlenmesi. (Bkz: [docker-compose.yml](file:///c:/Users/iyunu/OneDrive/Masa%C3%BCst%C3%BC/docker-compose.yml))
- [x] **GÖREV 1.5 (Orchestrator):** GitHub sürüm kontrolü için ilk yapının kurulması ve `main` branch'e commitlenmesi.
- [x] **GÖREV 1.12 (Validator):** Güvenlik ve Maskeleme doğruluğunu test edecek Validator test senaryolarının belirlenmesi. (Bkz: [validation_report.md](file:///C:/Users/iyunu/.gemini/antigravity/brain/f0801f50-e2f2-4990-94fe-9e40c0e68d1b/validation_report.md))
- [x] **GÖREV 1.13 (Validator):** Bellek kullanımı ve saniyede işlenen log sayısı (throughput) ölçüm metriklerinin ve profil çıkarma planının tasarlanması. (Bkz: [validation_report.md](file:///C:/Users/iyunu/.gemini/antigravity/brain/f0801f50-e2f2-4990-94fe-9e40c0e68d1b/validation_report.md))
- [x] **GÖREV 1.14 (Validator):** İlk mimari tasarımların rules.md anayasasına uygunluğunun denetlenmesi ve Sprint 1 mimari onayı. (Bkz: APPROVED statüsü)

