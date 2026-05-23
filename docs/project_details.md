CENG302 Dönem Sonu Ödevi - Data Middleware

Bir borsa kuruluşu için ara katman yazılım hazırlamanız isteniyor. Sistemin çalışmasını göstermek

için veri üreten modülü de gerçeklemeniz gerekmektedir.

Proje iki docker modülünden oluşacaktır. İlki veri üreten ikincisi de bu veriyi işleyen ara katman.

Veri üreten docker, gerçek sistemi simüle ederek günlük (log) verileri üretecek

Veri işleyen docker, sizin ara katman servis modülünüz.

Ara katman (middleware) modülü aşağıdaki görevleri gerekleştirmelidir:

1- Güvenlik: hassas veriler anonimleştirilerek dönüştürülmeli (örn kredi kartı, tckimlik no, e-posta

vb. )

2- Zenginleştirme: logları mikroservisler için daha verimli hale getirmek için özel etiketler bilgiler

eklemeniz beklenmektedir. (örneğin: o günlükle ilgili bilgiler, “gönderici id:”, “transaction no:”,

“hata - kritik olma durumu”, “mesaj:”, “debug” gibi)

3- performans (filtreleme): info warning gibi önemsiz logları filtreleyerek işleme devam etmemek.

4- biçim özelleştirme (system admin, cybersec, web dev rolleri farklı formatta çıktı istemektedir.)

bunlara göre ilgili günlükleri sırayla html, csv ve json formatlı iletebilmelidir.

Ödevde en az iki tasarım kalıbı kullanmanız gerekmektedir.

Veri üreten docker ile tüm senaryolara ait verileri üretip iletmeniz beklenmektedir.

Sistem performansı için yüksek sayıda veriyi üretip ileterek ara katmanın performans aralığını

ölçmeniz beklenmektedir.

Ödevin çalışır halini, yapılanalra dair raporunuzu edsye yüklemeniz ve

kod ve uygulama üzerinden

1- projenin nasıl çalıştığını neler yaptığını

2- tasarım kalıplarını nerede hangi amaçla ve nasıl kullandığınızı

3- sistem performansını

en fazla 15 dakikalık bir video ile gösterip anlatmanız isteniyor.

Yapay zeka araçları kullanmanız serbesttir, raporunuzda belirtmeniz yeterlidir. Ancak eğer doğrudan

bu dokümanı verip sonuç beklerseniz ödevin asıl amacı olan sizin bu proje ile deneyim kazanmanız

gerçekleşmeyecektir.

Ödev son teslim tarihi: 09 Haziran’dır. Açılmayan, çalışmayan, erişilemeyen bağlantı ve kodların

sorumluluğu öğrenciye aittir. Geç gönderim kabul edilmeyecektir. 

