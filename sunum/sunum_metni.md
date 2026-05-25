# CENG302 Data Middleware - Video Sunum Metni

Bu metin, proje teslimi için hazırlayacağınız **en fazla 15 dakikalık** sunum videosu için bir yol haritası ve konuşma metni şablonudur. Ekranı kaydederken bu akışı takip edebilirsiniz.

---

## ⏱️ Video Bölümleri ve Süre Dağılımı

| Bölüm | Konu | Hedef Süre |
| :--- | :--- | :--- |
| **Giriş** | Merhaba, Proje Konusu ve Modüllerin Tanıtımı | ~1.5 Dakika |
| **Bölüm 1** | Uygulama Tanıtımı ve Canlı Çalıştırma Demosu (Docker, Çıktı Dosyaları) | ~4.5 Dakika |
| **Bölüm 2** | Kod İncelemesi: Tasarım Kalıpları ve SOLID Prensipleri | ~5.0 Dakika |
| **Bölüm 3** | Sistem Performansı, Backpressure (Geri Basınç) ve Log Rotasyonu | ~3.0 Dakika |
| **Kapanış** | Özet ve Teşekkür | ~1.0 Dakika |

---

## 🎙️ Adım Adım Sunum Akışı ve Konuşma Metni

### 🎬 Giriş: Merhaba ve Proje Konusu (Süre: ~0:00 - 1:30)

*   **Ekran:** Tarayıcıda GitHub deposu ana sayfası veya IDE (VS Code) açık olsun.
*   **Konuşma Metni:**
    > *"Merhaba hocam, ben [Adınız Soyadınız]. Bugün sizlere CENG302 Yazılım Mühendisliği Dönem Sonu Projesi kapsamında geliştirdiğim 'Data Middleware' (Veri Ara Katmanı) projesini sunacağım.*
    >
    > *Projemizin temel amacı; bir borsa kuruluşu için saniyede binlerce log üreten bir simülatörden gelen ham verileri ağ üzerinden TCP soketi ile dinlemek, bu logları gerçek zamanlı işleme boru hattından geçirerek kişisel verileri maskelemek, gönderici id, transaction no gibi verilerle zenginleştirmek, son olarak da sistem yöneticileri, siber güvenlik uzmanları ve web geliştiricileri için sırasıyla HTML, CSV ve JSON formatlarında diske yazmaktır.*
    >
    > *Projemiz tamamen TypeScript dilinde yazılmış olup, altyapı olarak birbirleriyle bridge network üzerinden haberleşen Docker konteynerleri kullanmaktadır. Bu sunumda sırasıyla projenin canlı demosunu yapacak, kod yapısındaki 5 tasarım kalıbını inceleyecek ve son olarak sistemin yüksek yük altındaki performansını, geri basınç (backpressure) yönetimini ve disk şişmesini engelleyen log rotasyonu sidecar çözümünü göstereceğim. Dilerseniz hemen canlı demo ile başlayalım."*

---

### 🚀 Bölüm 1: Projenin Çalıştırılması ve Canlı Demo (Süre: ~1:30 - 6:00)

*   **Ekran:** Terminal (PowerShell/Bash) ekranına geçin.
*   **Konuşma Metni:**
    > *"Projemiz üç temel docker servisinden oluşuyor: 'middleware', 'producer' ve 'log-rotator'. Projeyi başlatmak için dizinimizde `docker compose up --build -d` komutunu çalıştırıyoruz. Ben sunum öncesinde konteynerlerimi başlattım, şu an arka planda aktif olarak çalışıyorlar.*
    >
    > *Terminalde `docker compose ps` komutunu çalıştırarak durumlarını kontrol edelim.* [Komutu çalıştırın ve çıktıyı gösterin] *Gördüğünüz gibi ceng302-middleware, ceng302-producer ve ceng302-log-rotator konteynerlerimizin üçü de ayakta ve çalışıyor.*
    >
    > *Şimdi middleware konteynerinin loglarını izleyelim: `docker compose logs -f middleware`* [Komutu çalıştırın, logların akışını gösterin]. *Gördüğünüz üzere veri üreticimiz (producer) her 100 milisaniyede bir 500 logluk paketler üretiyor. Ara katmanımız ise bu logları anlık olarak alıp filtreliyor, maskeliyor ve diske yazıyor. Örneğin son pakette 429 adet önemsiz log filtrelenip drop edilmiş ve kalan kritik loglar başarıyla dışa aktarılmış.*
    >
    > *Şimdi bu çıktıların host makinemizdeki yansımasına bakalım. Projemizin kök dizininde yer alan `output/` klasörüne gidiyoruz.* [IDE'de veya Windows Explorer'da output klasörünü açın].
    > *Burada 3 adet dosya görüyoruz: `system_admin.html`, `web_dev.json` ve `cybersec.csv`.*
    >
    > 1. *İlk olarak `system_admin.html` dosyasını tarayıcıda açalım.* [Dosyayı tarayıcıda açın]. *Sistem yöneticileri için hazırlanan bu tabloda, hata seviyesi CRITICAL olan satırlar kırmızı renkle vurgulanmıştır. Burada log bütünlüğünün korunması adına Details sütunu dahil tüm alanlar gösterilmekte; ancak isim, TC Kimlik, kredi kartı ve e-posta gibi kişisel veriler maskelenmiş olarak sunularak KVKK uyumluluğu sağlanmaktadır.*
    > 2. *İkinci olarak `web_dev.json` dosyasını açalım.* [JSON dosyasını editörde gösterin]. *Web geliştiricileri için hazırlanan bu çıktı, sistemdeki tüm hata izlerini (traceback), ham mesajları ve detayları barındıran tam bir JSON dizisidir.*
    > 3. *Üçüncü olarak `cybersec.csv` dosyasını Excel'de gösterelim.* [Excel'de veya metin editöründe CSV'yi açın]. *Siber güvenlik ekibi için hazırlanan bu dosyada, loglar noktalı virgülle (`;`) ayrılmıştır. Excel'de açtığımızda her sütun düzgün şekilde bölünmüştür. Buradaki en kritik nokta kişisel verilerin maskelenmiş olmasıdır: isimler baş harfleri hariç yıldızlanmış, TC Kimlik numaralarının sadece son 2 hanesi görünür kılınmış, kredi kartlarının sadece son 4 hanesi korunmuş ve e-postaların domain kısımları muhafaza edilmiştir.*
    >
    > *Burada önemli bir detay olarak logların önem derecelerinin (seviyelerinin) neye göre belirlendiğine ve hataların nedenlerine değinmek istiyorum. Sistemimizdeki loglar borsa akışındaki gerçek olaylara göre yapılandırılmıştır:*
    > * **INFO (Normal Akış):** Başarılı emir girişleri, bakiye yatırma ve oturum açma gibi olağan sistem operasyonlarıdır.
    > * **WARNING (Uyarılması Gereken Durumlar):** Sistem akışını kesmeyen fakat izlenmesi gereken durumlardır. Örneğin, hatalı şifre girişi, kullanıcının kendi emrini iptal etmesi veya API istek limitine yaklaşılması bu seviyededir.
    > * **ERROR (İşlem Engelleyici Hatalar):** `ERR_MARGIN_LACK` (yetersiz teminat nedeniyle emrin iptali), `ERR_BALANCE_LACK` (yetersiz bakiye nedeniyle çekim hatası) veya `ERR_DB_TIMEOUT` (veritabanı zaman aşımı) gibi belirli bir işlemin başarısızlığıyla sonuçlanan durumlardır ve sebepleri hata kodlarıyla log detayına yazılır.
    > * **CRITICAL (Sistem/Güvenlik Alarmları):** Sistemin ayakta kalmasını veya güvenliğini tehdit eden kritik alarm durumlarıdır. Örneğin, `SEC_ALARM_01` (kaba kuvvet saldırısı şüphesi), `SYS_ALARM_02` (emir iletilen dış aracı kurum API'sinin kapalı olması) veya `SYS_ALARM_03` (sunucu RAM'inin bitmesi) bu seviyede alarm oluşturur.
    >
    > *Şimdi dilerseniz kod yapısına ve kullandığımız tasarım kalıplarına geçelim."*

---

### 💻 Bölüm 2: Kod Yapısı ve Tasarım Kalıpları (Süre: ~6:00 - 11:00)

*   **Ekran:** IDE'de `shared/interfaces.ts` dosyasını açın.
*   **Konuşma Metni:**
    > *"Şimdi projenin mimari şemasını ve yazılım mühendisliği prensiplerini inceleyelim. `rules.md` dosyasındaki kural gereği projemizde 5 farklı tasarım kalıbı arayüzler tanımlanarak kullanılmıştır. Bunları kod üzerinden tek tek inceleyelim:*
    >
    > 1. **Adapter Pattern:** [middleware/src/adapter/chunkAdapter.ts dosyasını açın] *TCP soketleri verileri akış halinde gönderir. Ağdaki paket bölünmelerini engellemek için NDJSON standardını seçtik. `TCPChunkAdapter` sınıfımız, gelen ham Buffer verilerini arabelleğe alıp her satır sonu (`\n`) karakterinde bölerek anlamlı JSON dizilerine dönüştürür. Yani ağ akışını veri modelimize adapte eder.*
    >
    > 2. **Chain of Responsibility (CoR) Pattern:** [middleware/src/pipeline/ dizinini açın] *Logları işlerken sırasıyla filtreleme, maskeleme ve zenginleştirme adımlarını uyguluyoruz. Generic tip destekli soyut `LogProcessor` sınıfımızdan türeyen halkalarımız sırayla çalışır. `FilterProcessor` en başta çalışarak `INFO` ve `WARNING` loglarını drop eder, böylece sonraki halkalara gereksiz yük binmez. `MaskProcessor` kişisel verileri regex kullanarak maskeler. `EnrichProcessor` ise zenginleştirme yapar.*
    >
    > 3. **Builder Pattern:** [middleware/src/builder/logBuilder.ts dosyasını açın] *Zenginleştirme halkasımızda `LogBuilder` sınıfını kullanıyoruz. `LogBuilder` sınıfımız, zenginleştirilmiş log nesnesini adım adım kurar. İçerisinde benzersiz UUID'lerle `transactionNo` ataması yapar, `senderId` değerini atar ve `build()` metoduyla nesneyi güvenli ve tutarlı bir anahtar sıralamasıyla oluşturur. Önemli bir detay: `build()` metodu başında önce `reset()` çağrılıp çağrılmadığını, ardından zorunlu alanların dolu olduğunu kontrol eder; bu sayıde hatalı kullanım anında anlaşılır bir hata mesajı elde ederiz.*
    >
    > 4. **Strategy Pattern:** [middleware/src/strategy/ dizinini açın] *Kullanıcı rollerine göre HTML, CSV ve JSON çıktılarını formatlayan algoritmalarımız `IFormatStrategy` arayüzünden türetilmiştir. Her strateji kendi formatlama mantığını tamamen izole bir biçimde barındırır. Özellikle `HtmlStrategy` içinde eklediğimiz `escapeHtml()` fonksiyonu, log mesajlarının HTML çıktısına doğrudan gömülmesinden kaynaklanabilecek XSS güvenlik açıklarını engeller. `getFormatType()` metodu ise dışa aktarım log mesajlarında aktif olarak kullanılmaktadır.*
    >
    > 5. **Factory Method Pattern:** [middleware/src/factory/formatterFactory.ts dosyasını açın] *Stratejileri üretmek için `FormatterFactory` sınıfını kurduk. SOLID'in Open-Closed (Gelişime açık, Değişime kapalı) ilkesine uymak adına switch-case yapılarından kaçındık. Bunun yerine bir **Registry (Kayıt Haritası)** kurarak rolleri yapıcı fonksiyonlarla eşleştirdik. Yeni bir rol veya format eklendiğinde fabrika kodunu değiştirmemize gerek yoktur, sadece haritaya kaydetmemiz yeterlidir.*
    >
    > *Mimari, bağımlılıkların arayüzler üzerinden enjekte edildiği Dependency Inversion ve her sınıfın tek görevi olduğu Single Responsibility ilkelerine tam uyumludur."*

---

### ⚡ Bölüm 3: Sistem Performansı, Backpressure ve Log Rotasyonu (Süre: ~11:00 - 14:00)

*   **Ekran:** Docker Compose loglarına veya terminale geçin.
*   **Konuşma Metni:**
    > *"Son olarak sistemin yüksek veri yükü altındaki kararlılığını ve performans çözümlerini inceleyelim. Sistemimizin yüksek verimlilikte çalışabilmesi için iki kritik mekanizma kurulmuştur:*
    >
    > *İlki **Backpressure (Geri Basınç)** yönetimidir. Verici ve alıcı arasında hız uyuşmazlığı olduğunda bellek patlamalarını (OOM) önlemek için hem istemci hem sunucu tarafında backpressure uygulanmıştır:*
    > * **Producer Tarafında:** `socket.write()` fonksiyonu false döndüğünde (yani TCP tamponu dolduğunda) log üretimi anlık olarak durdurulur. Soket tamponu boşalıp `drain` olayı tetiklendiğinde üretim kaldığı yerden devam eder.
    > * **Middleware Tarafında:** Sunucu belleğinde biriken kuyruk için **Watermark** modeli tasarlanmıştır. Bellek kuyruğundaki log sayısı **10.000** limitini (`High Watermark`) aşarsa TCP soketi duraklatılır (pause edilir). İşleyici boru hattımız logları eritip kuyruk boyutu **2.000** loga (`Low Watermark`) indiğinde soket tekrar açılır (resume edilir). Bu sayede bellek tüketimi sabit ve güvenli sınırlar içinde tutulur.
    >
    > *Sistemimizin performans aralığını ve limitlerini ölçmek için sunucu kodumuza canlı bir performans analiz motoru entegre ettik. Ekrandaki günlüklerde görebileceğiniz gibi:* [Ekranda middleware konsol loglarını gösterin]
    > * `[Performance Metrics]` *etiketiyle her 1 saniyede bir veya her kuyruk temizlendiğinde o ana kadar işlenen toplam log sayısını, saniyedeki anlık işlem hızını, milisaniye cinsinden gecikmeyi ve RAM tüketimini canlı olarak takip edebiliyoruz.*
    > * *Normal çalışma yükünde saniyede 5.000 ham log gönderildiğinde, sistem bunu ortalama 0.5-2.0 milisaniye gibi yok denecek kadar az gecikmelerle işleyip 25 MB RAM seviyesinde sabit kalarak son derece kararlı çalışır.*
    > * *Stres testi yapmak için verici tarafındaki chunk boyutunu 5.000'e, gönderim sıklığını ise 5 milisaniyeye düşürerek saniyede 1 milyon log göndermeyi denediğimizde, sistem maksimum limitlerine ulaşır. Bu donanımda saniyede ortalama 45.000 ila 50.000 log işleme hızına ulaştığımızı görüyoruz. Aynı zamanda High Watermark limitleri tetiklenerek TCP soketinin anlık duraklayıp başladığını, bellek kullanımının ise 50 MB civarında kilitlenerek aşırı yük altında bile asla çökmediğini (OOM olmadığını) kanıtlamış oluyoruz.*
    >
    > *İkinci performans ve kaynak yönetimi unsurumuz ise **Log Rotasyonudur**. Güvenlik loglarının tutulduğu `cybersec.csv` dosyası zamanla gigabaytlarca boyuta ulaşarak diski doldurabilir. Bu sorunu çözmek için Docker altyapısına bağımsız bir sidecar container (`log-rotator`) ekledik. Bu container, aktif log dosyasını izler ve boyutu **5 MB** sınırını aştığında otomatik olarak arşive kaldırır. En eski arşiv dosyasını silerek diskte maksimum 4 adet dosya tutulmasını garanti eder. Bu sayede toplam disk alanı kullanımımız **20 MB** ile sınırlandırılmıştır ve sistemin açık kaldığı süre boyunca diski şişirmesi profesyonel düzeyde engellenmiştir."* [Output klasöründeki cybersec.1.csv, cybersec.2.csv gibi rotated dosyaları gösterin].

---

### 🏁 Kapanış (Süre: ~14:00 - 15:00)

*   **Ekran:** Sizi veya depo ana sayfasını gösteren bir ekran.
*   **Konuşma Metni:**
    > *"Özetlemek gerekirse; bu ödevde bir ara katmanın güvenlik, zenginleştirme, performans filtrelemesi ve rol bazlı çıktı gereksinimlerini, en iyi yazılım mühendisliği pratiklerini ve 5 farklı tasarım kalıbını kullanarak başarıyla hayata geçirdik.*
    >
    > *Kodlarımızın tamamı test edilmiş, Dockerize edilmiş ve Git depomuza yüklenmiştir. Beni dinlediğiniz için teşekkür ederim. Sorularınız varsa yanıtlamaktan memnuniyet duyarım."*
