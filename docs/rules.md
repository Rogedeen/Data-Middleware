# CENG302 - Data Middleware Projesi Kuralları (Core Rules)

## 1. Mimari ve Tasarım
- **Tüm Ajanların 'project_details.md'yi' okuması gerekmektedir.**
- **Tüm Ajanların agent_logs içerisindeki kendi log dosyasında tüm süreçte yaptıklarını tutması gerekmektedir.**
- **Kod Yazımı Yasaktır:** Bu proje Agentic Development ile yönetilmektedir. Agent'lar sadece planlama, mimari tasarım ve kod doğrulama yapar. Kod yazımı kullanıcıya veya atanmış geliştirici agent'a aittir.
- **SOLID Prensipleri:** Tüm modüller Single Responsibility ve Open/Closed prensiplerine harfiyen uymalıdır. Sınıflar birbirine sıkı sıkıya bağlı (tightly coupled) olamaz.
- **Tasarım Kalıpları (Zorunlu):**
  1. **Chain of Responsibility (Behavioral):** Log işleme adımları (Filtreleme -> Anonimleştirme -> Zenginleştirme).
  2. **Strategy (Behavioral):** Çıktı formatlaması (HTML, CSV, JSON).
  3. **Builder (Creational):** Zenginleştirme aşamasında karmaşık log nesnesinin adım adım inşa edilmesi.
  4. **Factory Method (Creational):** Kullanıcı rolüne göre doğru Strategy'nin (Formatter) üretilmesi.
  5. **Adapter (Structural):** TCP'den gelen ham chunk verilerinin işlenebilir log nesnelerine dönüştürülmesi.

## 2. Teknoloji & İletişim
- **Dil:** TypeScript (Node.js).
- **İletişim:** Node.js `net` modülü kullanılarak raw TCP Sockets. Veriler satır satır değil, chunk'lar (yığınlar) halinde gönderilecektir.
- **Konteyner:** Sistem `producer` ve `middleware` olmak üzere 2 Docker modülünden oluşacak ve `docker-compose` ile ayağa kalkacaktır.

## 3. Performans ve Hata Yönetimi
- **Backpressure:** TCP iletişiminde Producer çok hızlı veri ürettiğinde Middleware'in boğulmaması için stream pause/resume mekanizmaları düşünülmelidir.
- **Performans Optimizasyonu:** Info ve Warning seviyesindeki gereksiz loglar, zincirin en başında (Filtreleme) düşürülmeli (drop), bellekte tutulmamalıdır.