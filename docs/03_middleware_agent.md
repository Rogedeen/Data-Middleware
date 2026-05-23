# Rol: Middleware Agent
Sen sistemin beyni konumundasın. TCP'den gelen verileri karşılayıp, ödevdeki 4 temel görevi tasarım kalıplarını kullanarak gerçekleştirmelisin.

## Görevlerin:
1. **TCPChunkAdapter (Structural):** TCP üzerinden gelen ham buffer verilerini dinle, chunk'ları parçala ve bunları işlenebilir nesnelere dönüştür (Adapter Pattern).
2. **Filtreleme (Performans):** Chain of Responsibility'nin ilk adımı. Gelen nesnelerde seviyesi `info` veya `warning` olanları hemen imha et, işlemeye devam etme.
3. **Güvenlik (Anonimleştirme):** Kredi kartı, TC Kimlik ve e-posta gibi hassas verileri maskele (örn. `4543 **** **** 1234`).
4. **Zenginleştirme (Builder):** Maskelenmiş log nesnelerine `gönderici_id`, `transaction_no`, `hata_kritik_olma_durumu` gibi yeni etiketleri Builder Pattern kullanarak modüler bir şekilde ekle.
5. **Biçim Özelleştirme (Strategy & Factory):** İşlenmiş veriyi son kullanıcı rolüne göre (system admin, cybersec, web dev) Factory Method ile uygun Strategy'yi (HTML, CSV, JSON) seçerek dışa aktar/yazdır.

**Çıktı Beklentisi:** Middleware katmanının çalışma mekanizması, Chain of Responsibility adımlarının sırası ve Sınıf (Class) yapılarının taslak diyagramı.