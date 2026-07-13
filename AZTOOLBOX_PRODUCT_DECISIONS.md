# AzToolBox — məhsul qərarları

Mənbə: `AZTOOLBOX_REMEDIATION_PLAN.md`, “Product decisions required” bölməsi.  
Status: yalnız qərar izahı; heç bir production dəyişikliyi və batch icrası yoxdur.

## Qısa terminlər

- **Metadata:** faylın içində görünməyən müəllif, proqram, yaradılma tarixi kimi əlavə məlumatlar.
- **ZIP:** bir neçə faylı bir paketdə endirməyə imkan verən arxiv.
- **Şəffaflıq / alpha:** şəklin tam və ya qismən şəffaf hissələri.
- **Qrafem:** insanın ekranda bir simvol kimi gördüyü vahid. Məsələn, bir emoji texniki olaraq bir neçə kod hissəsindən yarana bilər.
- **Slug:** alətin URL-dəki qısa adı, məsələn `pdf-splitter`.
- **JWT:** məlumat hissələri oxuna bilən, lakin ayrıca yoxlanmadıqda etibarlı olduğu sübut edilməyən token formatı.

## Qərar 1 — PDF bölücünün çıxışı

1. **Qərar və qısa başlıq:** PD-1 — PDF bölücü nəticəni necə verməlidir?
2. **Təsirlənən alətlər:** PDF bölücü; dolayı olaraq PDF səhifə çıxarıcı.
3. **Issue ID:** AZT-015.
4. **Cari davranış:** istifadəçi bir neçə səhifə seçəndə sistem onların hamısını bir yeni PDF-də birləşdirir. Halbuki alətin mətni səhifələrin “ayrıca PDF” kimi çıxarılacağını deyir.
5. **Niyə qeyri-müəyyəndir:** “PDF bölmək” bəzən hər səhifəni ayrı fayl etmək, bəzən isə seçilmiş hissədən bir yeni PDF yaratmaq kimi başa düşülür. İkinci davranış artıq “PDF səhifə çıxarıcı” alətinə çox bənzəyir.
6. **Real seçimlər:** bir kombinə PDF; hər səhifə üçün ayrı endirmə; ayrı PDF-ləri bir ZIP paketində endirmə.
7. **Üstünlük və çatışmazlıqlar:**
   - **Bir PDF:** sadədir və mobil cihazda rahat endirilir; amma “ayrıca” vədinə uyğun deyil və extractor-la təkrarlanır.
   - **Çoxlu ayrıca endirmə:** ZIP lazım deyil; amma brauzer çoxlu endirməni bloklaya bilər və istifadəçi üçün qarışıqdır.
   - **ZIP:** bir kliklə bütün ayrıca PDF-lər alınır və alətin adı/vədi ilə uyğun gəlir; amma əlavə paketləmə işi və ZIP açmaq addımı yaranır.
8. **Tövsiyə:** hər seçilmiş səhifəni ayrıca PDF edib hamısını bir ZIP-də endirmək.
9. **Niyə AzToolBox üçün uyğundur:** pulsuz B2C alətdə istifadəçi nəticəni bir kliklə almalıdır. ZIP çoxlu brauzer icazəsi istəmir və “bölücü”nü “çıxarıcı”dan aydın fərqləndirir.
10. **Dəqiq görünən davranış:** istifadəçi `1,3,5` yazıb “Böl” düyməsinə basır; `original-sehifeler.zip` endirilir və içində `sehife-1.pdf`, `sehife-3.pdf`, `sehife-5.pdf` olur. UI əvvəlcədən “3 ayrıca PDF ZIP-də endiriləcək” yazır.
11. **Bloklanan batch:** Batch 4.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**. Tövsiyə default kimi səssiz qəbul edilməməlidir, çünki əsas çıxış forması dəyişir.

## Qərar 2 — PDF səhifələrinin sırası və təkrarları

1. **Qərar və qısa başlıq:** PD-2 — istifadəçinin yazdığı sıra və təkrar səhifələr saxlanmalıdırmı?
2. **Təsirlənən alətlər:** PDF bölücü, PDF səhifə çıxarıcı, PDF səhifə silici.
3. **Issue ID:** AZT-015.
4. **Cari davranış:** sistem səhifələri avtomatik artan sıraya düzür və təkrar nömrələri silir. Məsələn, `3,1,3` nəticədə `1,3` olur.
5. **Niyə qeyri-müəyyəndir:** bəzi istifadəçi səhifələri sadəcə seçir, bəzisi isə yeni PDF-in dəqiq sırasını qurmaq istəyir. Səhifə siləndə sıra və təkrarın mənası yoxdur, çıxaranda isə ola bilər.
6. **Real seçimlər:** yazılan sıra və təkrarları tam saxlamaq; hər alətdə avtomatik sıralamaq və təkrarları silmək; alətə görə fərqli qayda tətbiq etmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Tam saxlamaq:** istifadəçinin niyyətinə hörmət edir və xüsusi sıra qurmağa imkan verir; səhvən yazılan təkrar da nəticədə qalır.
   - **Normallaşdırmaq:** nəticə proqnozlaşdırılan və təmiz olur; amma istifadəçinin istədiyi sıra səssiz dəyişir.
   - **Alətə görə:** məntiqlidir — çıxarma/bölmədə sıra saxlanır, silmədə təkrarlar əhəmiyyətsizdir; qaydanı UI-də izah etmək lazımdır.
8. **Tövsiyə:** splitter və extractor-da sıra və təkrarları saxlamaq; remover-də təkrarları zərərsiz şəkildə bir dəfə saymaq.
9. **Niyə AzToolBox üçün uyğundur:** sadə alət istifadəçinin yazdığını səssiz dəyişməməlidir. Eyni zamanda silmə alətində mənasız mürəkkəblik yaradılmır.
10. **Dəqiq görünən davranış:** extractor-da `3,1,3` üç səhifəli, 3–1–3 sıralı PDF yaradır; remover-də həmin giriş 1 və 3-cü səhifələri bir dəfə silir. Qayda input altında qısa qeyd olunur.
11. **Bloklanan batch:** Batch 4.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**. Əsas fayl məzmunu dəyişdiyi üçün istifadəçi təsdiqi məqsədəuyğundur.

## Qərar 3 — Tərs və qismən səhv səhifə aralıqları

1. **Qərar və qısa başlıq:** PD-3 — `5-3` və `1,abc,4` kimi girişlər necə idarə olunmalıdır?
2. **Təsirlənən alətlər:** PDF bölücü, PDF səhifə çıxarıcı, PDF səhifə silici.
3. **Issue ID-ləri:** AZT-009, AZT-015.
4. **Cari davranış:** `5-3` avtomatik `3-5` kimi qəbul edilir; qismən səhv girişdə düzgün hissələr işlənə bilər. Çox böyük aralıq brauzeri yükləyə bilər.
5. **Niyə qeyri-müəyyəndir:** avtomatik düzəltmə rahatdır, amma istifadəçinin səhvini gizlədə bilər. Qismən qəbul isə istifadəçinin gözlədiyindən fərqli PDF yarada bilər.
6. **Real seçimlər:** tərs aralığı avtomatik düzəltmək; bütün səhv girişi rədd etmək; düzgün hissəni işlədib səhv hissəni keçmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Avtomatik düzəltmək:** sürətlidir; niyyəti səhv təxmin edə bilər.
   - **Tam rədd:** ən təhlükəsiz və aydındır; istifadəçi xətanı düzəltmək üçün bir əlavə addım edir.
   - **Qismən qəbul:** bəzi nəticə verir; data itkisi və yanlış çıxış riski ən yüksəkdir.
8. **Tövsiyə:** tərs və ya qismən səhv ifadəni tam rədd etmək, problemli hissəni dəqiq göstərmək.
9. **Niyə AzToolBox üçün uyğundur:** adi istifadəçi üçün səssiz “ağıllı düzəliş”dən daha vacibi düzgün sənəd almaqdır. Aydın Azərbaycan dilində xəta əlavə addımı minimuma endirir.
10. **Dəqiq görünən davranış:** `5-3` üçün “Aralıq kiçikdən böyüyə yazılmalıdır: 3-5”; `1,abc,4` üçün “`abc` səhifə ifadəsi deyil” görünür. Heç bir fayl yaranmır. Həddən böyük aralıq da əvvəlcədən rədd edilir.
11. **Bloklanan batch:** Batch 4-ün səhifə semantikası; Batch 1-də təhlükəsizlik limitinin tam qaydası da bu qərardan asılıdır.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**, lakin tövsiyə olunan təhlükəsiz default istifadəçidən ayrıca təsdiq almadan qəbul edilə bilər.

## Qərar 4 — PDF metadata təmizləmə siyasəti

1. **Qərar və qısa başlıq:** PD-4 — metadata nə qədər tam silinməlidir?
2. **Təsirlənən alətlər:** PDF metadata təmizləyici.
3. **Issue ID:** AZT-003.
4. **Cari davranış:** başlıq və müəllif kimi bəzi sahələr təmizlənir, amma AzToolBox creator/producer məlumatı və tarixlər yenidən əlavə olunur.
5. **Niyə qeyri-müəyyəndir:** bəzi proqramlar çıxışa öz adını yazır; “metadata təmizləyici” isə istifadəçidə bütün görünməyən məlumatların silinəcəyi gözləntisi yaradır. PDF səhifəsinin içində görünən mətn və gizli obyektlər ayrıca mövzudur.
6. **Real seçimlər:** bütün mümkün Info metadata-sını silmək; AzToolBox attribution saxlamaq; yalnız bəzi sahələri silib bunu “qismən təmizləmə” kimi açıqlamaq.
7. **Üstünlük və çatışmazlıqlar:**
   - **Tam silmək:** məxfilik vədinə ən uyğundur; kitabxana bəzi texniki sahələri yenidən yarada bilər və ciddi test lazımdır.
   - **Attribution saxlamaq:** məhsul izi qalır; məxfilik alətinin məqsədinə ziddir.
   - **Qismən təmizləmək:** texniki olaraq asandır; ad və istifadəçi gözləntisi yanıltıcı qalır.
8. **Tövsiyə:** bütün standart və xüsusi Info sahələrini və tarixləri silmək, AzToolBox adı əlavə etməmək; səhifə məzmununun ayrıca təmizlənmədiyini açıq yazmaq.
9. **Niyə AzToolBox üçün uyğundur:** pulsuz B2C məxfilik alətində etibar marka attribution-dan daha dəyərlidir. İstifadəçi “təmizlə” deyəndə nəticə mümkün qədər neytral olmalıdır.
10. **Dəqiq görünən davranış:** əməliyyatdan əvvəl “Müəllif, proqram, tarix və digər sənəd məlumatları silinəcək; səhifədə görünən mətn dəyişməyəcək” yazılır. Endirilən PDF-də AzToolBox/creator/producer/tarix metadata-sı olmur.
11. **Bloklanan batch:** Batch 1.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**, amma alətin mövcud adı və məxfilik vədi tövsiyə olunan default-u ayrıca soruşmadan seçməyə kifayət edir.

## Qərar 5 — Şəkil çıxış formatı

1. **Qərar və qısa başlıq:** PD-5 — şəkil alətləri orijinal formatı saxlamalı, standart formata çevirməli, yoxsa seçimi istifadəçiyə verməlidir?
2. **Təsirlənən alətlər:** şəkil sıxışdırıcı, metadata təmizləyici, ölçü dəyişdirici; dolayı olaraq bütün Canvas əsaslı şəkil alətləri.
3. **Issue ID-ləri:** AZT-008, AZT-019, AZT-020.
4. **Cari davranış:** compressor bütün nəticələri JPEG edir; metadata cleaner və resizer əsasən PNG verir. Format dəyişikliyi həmişə əvvəlcədən aydın göstərilmir; şəffaflıq və animasiya itə bilər.
5. **Niyə qeyri-müəyyəndir:** formatı saxlamaq istifadəçi üçün təbiidir, amma hər formatda eyni əməliyyat və metadata təmizliyi mümkün deyil. Standart format sadədir, lakin fayl xüsusiyyətlərini dəyişir.
6. **Real seçimlər:** mümkün olduqda source formatı saxlamaq; hər alət üçün sabit standart format; çıxış formatını istifadəçiyə seçdirmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Source-u saxlamaq:** ən az sürpriz və az data itkisi; codec imkanları fərqlidir və bəzi hallarda mümkün deyil.
   - **Standartlaşdırmaq:** sadə kod və proqnozlaşdırılan çıxış; şəffaflıq, ölçü və uyğunluq pisləşə bilər.
   - **İstifadəçi seçimi:** nəzarət verir; UI-ni mürəkkəbləşdirir və yanlış seçim riski yaradır.
8. **Tövsiyə:** təhlükəsiz olduqda orijinal formatı saxlamaq; saxlamaq mümkün deyilsə sadə çıxış seçimi göstərmək və formatı/şəffaflıq nəticəsini əməliyyatdan əvvəl yazmaq.
9. **Niyə AzToolBox üçün uyğundur:** default sadə qalır, təcrübəli istifadəçiyə də yalnız lazım olduqda seçim verilir. Azərbaycanca aydın xəbərdarlıq sürprizi azaldır.
10. **Dəqiq görünən davranış:** PNG resizer default olaraq PNG verir və şəffaflığı saxlayır; JPEG JPEG qalır. Format dəyişməlidirsə “Çıxış: PNG — animasiya saxlanmayacaq” seçimi görünür və istifadəçi təsdiq edir.
11. **Bloklanan batch:** Batch 4; Batch 1 compressor postcondition-ları da bu siyasətlə uyğunlaşdırılmalıdır.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**. Fayl formatı və ölçüsü dəyişdiyi üçün istifadəçi/product owner təsdiqi alınmalıdır.

## Qərar 6 — Compressor nəticəsinin həqiqətən kiçik olması

1. **Qərar və qısa başlıq:** PD-6 — yeni fayl orijinaldan böyükdürsə nə edilməlidir?
2. **Təsirlənən alətlər:** şəkil sıxışdırıcı.
3. **Issue ID:** AZT-008.
4. **Cari davranış:** sistem hər halda yeni JPEG verir və bunu uğurlu sıxışdırma kimi göstərir; kiçik PNG böyüyə, şəffaflıq itə bilər.
5. **Niyə qeyri-müəyyəndir:** yenidən kodlama bəzən keyfiyyəti dəyişsə də ölçünü azaltmır. “Sıxışdırma” sözü istifadəçiyə daha kiçik fayl vəd edir.
6. **Real seçimlər:** hər nəticəni vermək; yalnız kiçik olanı endirməyə təqdim etmək; böyük nəticəni xəbərdarlıqla əlavə seçim kimi vermək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Hər nəticə:** istifadəçi istəsə alır; “ölçünü azalt” vədi pozulur.
   - **Yalnız kiçik nəticə:** ən sadə və dürüstdür; istifadəçi format çevrilməsini ayrıca istəyə bilərdi.
   - **Xəbərdarlıqla böyük nəticə:** nəzarət verir; əlavə qərar və UI mürəkkəbliyi yaradır.
8. **Tövsiyə:** nəticə kiçikdirsə endirməni göstərmək; böyükdürsə “ölçü azalmadı” deyib orijinalı saxlamağı əsas seçim, böyük yeni faylı isə yalnız açıq əlavə seçim etmək.
9. **Niyə AzToolBox üçün uyğundur:** B2C istifadəçisinin əsas məqsədi faylı kiçiltməkdir. Sistem bu məqsəd baş tutmadıqda uğur iddiası etməməlidir.
10. **Dəqiq görünən davranış:** nəticədə “Orijinal: 163 KB, yeni: 181 KB — ölçü azalmadı” görünür. Əsas düymə “Orijinalı saxla”, ikinci dərəcəli düymə “Yenə də JPEG-i endir” olur. Şəffaflıq itəcəksə ayrıca xəbərdarlıq edilir.
11. **Bloklanan batch:** Batch 1.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**, lakin yanlış “compression” uğurunu dayandıran tövsiyə default kimi ayrıca soruşmadan istifadə edilə bilər.

## Qərar 7 — “Simvol sayı”nın mənası

1. **Qərar və qısa başlıq:** PD-7 — simvol texniki kod hissələri ilə, yoxsa insanın gördüyü işarələrlə sayılmalıdır?
2. **Təsirlənən alətlər:** söz/simvol sayacı.
3. **Issue ID:** AZT-021.
4. **Cari davranış:** JavaScript-in texniki UTF-16 uzunluğu göstərilir. Məsələn, bir `👩‍💻` emojisi 5 simvol sayıla bilər.
5. **Niyə qeyri-müəyyəndir:** proqramlaşdırmada “simvol” bir neçə fərqli texniki ölçü deməkdir; adi istifadəçi isə ekranda gördüyü işarəni nəzərdə tutur.
6. **Real seçimlər:** UTF-16 vahidləri; Unicode code point-lər; istifadəçinin gördüyü qrafemlər.
7. **Üstünlük və çatışmazlıqlar:**
   - **UTF-16:** ən asan və sürətlidir; istifadəçi üçün çaşdırıcıdır.
   - **Code point:** texniki baxımdan daha düzgündür; birləşmiş emoji və aksent yenə bir neçə sayıla bilər.
   - **Qrafem:** insan gözləntisinə ən uyğundur; köhnə brauzer üçün fallback lazımdır.
8. **Tövsiyə:** qrafemləri saymaq; dəstəksiz brauzerdə izah edilmiş code-point fallback istifadə etmək.
9. **Niyə AzToolBox üçün uyğundur:** əsas auditoriya proqramçı deyil. Azərbaycan hərfləri, emoji və birləşmiş işarələr ekranda göründüyü kimi sayılmalıdır.
10. **Dəqiq görünən davranış:** `👩‍💻` üçün “Simvol: 1” görünür. Sayğac canlı yenilənir, ekran oxuyucu üçün dəyişikliklər həddən artıq səsli olmadan elan edilir.
11. **Bloklanan batch:** Batch 5.
12. **Qərar statusu:** **təhlükəsiz şəkildə sonraya saxlanıla bilər**, amma issue həll ediləcəksə tövsiyə default kimi soruşmadan qəbul edilə bilər.

## Qərar 8 — JWT nəticəsində təhlükəsizlik xəbərdarlığı

1. **Qərar və qısa başlıq:** PD-8 — JWT-nin yalnız oxunduğu, etibarlılığının yoxlanmadığı necə göstərilməlidir?
2. **Təsirlənən alətlər:** JWT decoder.
3. **Issue ID-ləri:** ayrıca structured issue yoxdur; auditdə regression-only intentional limitation kimi qeyd edilib.
4. **Cari davranış:** tokenin header və payload hissələri göstərilir, amma imza, bitmə tarixi və etibarlılıq yoxlanmır; bu fərq kifayət qədər görünən deyil.
5. **Niyə qeyri-müəyyəndir:** “decoder” texniki olaraq yalnız oxuma deməkdir, amma adi istifadəçi görünən məlumatı “token düzgündür” kimi başa düşə bilər.
6. **Real seçimlər:** kiçik qeyd; nəticənin yanında daimi və nəzərə çarpan xəbərdarlıq; tam signature/expiry validation əlavə etmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Kiçik qeyd:** UI təmiz qalır; asanlıqla gözdən qaçır.
   - **Daimi xəbərdarlıq:** yanlış təhlükəsizlik nəticəsinin qarşısını alır; bir qədər vizual yer tutur.
   - **Tam validation:** daha güclü alətdir; açar/issuer/audience konfiqurasiyası tələb edir və sadə lokal alət scope-unu xeyli böyüdür.
8. **Tövsiyə:** decoder-only saxlamaq və nəticənin yanında daimi xəbərdarlıq göstərmək.
9. **Niyə AzToolBox üçün uyğundur:** pulsuz sadə toolbox üçün açar idarəetməsi və server inteqrasiyası artıq mürəkkəbdir. Aydın xəbərdarlıq təhlükəsizlik riskini az xərclə həll edir.
10. **Dəqiq görünən davranış:** nəticənin üstündə “Bu alət tokeni yalnız oxuyur. İmza, bitmə tarixi və etibarlılıq yoxlanmır” xəbərdarlığı həmişə görünür.
11. **Bloklanan batch:** Batch 5-də limitation disclosure/regression işi.
12. **Qərar statusu:** **yalnız wording/documentation qərarıdır** və tövsiyə default kimi soruşmadan tətbiq oluna bilər.

## Qərar 9 — Faiz kalkulyatorunun scope-u və dəqiqliyi

1. **Qərar və qısa başlıq:** PD-9 — yalnız “ədədin faizi”, həm də “faiz dəyişimi”, yoxsa ayrı alətlər?
2. **Təsirlənən alətlər:** faiz kalkulyatoru.
3. **Issue ID:** AZT-013.
4. **Cari davranış:** yalnız `Y-nin X%-i` hesablanır. Mətn faiz dəyişimini də vəd edir, amma bu rejim yoxdur; nəticə məhdud onluq dəqiqliyi ilə göstərilir.
5. **Niyə qeyri-müəyyəndir:** “faiz kalkulyatoru” bir neçə fərqli hesab deməkdir. Bir UI-də çox rejim rahat ola bilər, amma yeni istifadəçi üçün qarışıqlıq yarada bilər.
6. **Real seçimlər:** dəyişmə rejimini eyni alətə əlavə etmək; mətndən bu vədi silib yalnız cari rejimi saxlamaq; iki ayrı alət yaratmaq.
7. **Üstünlük və çatışmazlıqlar:**
   - **Eyni alətdə iki rejim:** istifadəçi hər şeyi bir yerdə tapır; rejim seçimi aydın dizayn tələb edir.
   - **Yalnız cari rejim:** ən sadədir; çox yayılmış faiz artımı/azalması ehtiyacı ödənmir.
   - **Ayrı alətlər:** hər ekran çox aydındır; kataloq şişir və funksiyalar parçalanır.
8. **Tövsiyə:** eyni alətdə iki aydın tab/rejim — “Ədədin faizi” və “Faiz dəyişimi”; hesabı tam dəqiqliklə aparıb yalnız görünüşü məntiqli formatlamaq.
9. **Niyə AzToolBox üçün uyğundur:** hər iki use-case gündəlik B2C ehtiyacıdır. İki açıq rejim kataloqu böyütmədən sadəliyi qoruyur və Azərbaycan dilində nümunə ilə asan başa düşülür.
10. **Dəqiq görünən davranış:** istifadəçi rejim seçir. “200-ün 15%-i” → `30`; “100-dən 120-yə dəyişmə” → `20% artım`. Daha uzun onluqlar hesabda saxlanır, nəticədə oxunaqlı göstərilir və lazım olsa dəqiq dəyər kopyalanır.
11. **Bloklanan batch:** Batch 3.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**. Yeni funksiya və UI əlavə etdiyi üçün istifadəçi/product owner təsdiqi alınmalıdır.

## Qərar 10 — Feedback formasının scope-u

1. **Qərar və qısa başlıq:** PD-10 — forma sadəcə lokal draft hazırlayır, e-poçta yönləndirir, yoxsa serverə göndərir?
2. **Təsirlənən alətlər/səhifələr:** “Rəy bildir” səhifəsi.
3. **Issue ID-ləri:** ayrıca structured issue yoxdur; auditdə regression-only intentional limitation kimi qeyd edilib.
4. **Cari davranış:** istifadəçi formu doldurur, submit etdikdə forma təmizlənir və məlumatın serverə göndərilmədiyi deyilir. Yəni real rəy çatdırılmır.
5. **Niyə qeyri-müəyyəndir:** səhifənin adı “Rəy bildir” real göndəriş gözləntisi yaradır, amma layihə statik, hesabsız və backendsizdir.
6. **Real seçimlər:** lokal draft olaraq saxlamaq; `mailto:`/kopyala/export ilə istifadəçinin öz e-poçt proqramına vermək; backend vasitəsilə həqiqətən göndərmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Lokal draft:** məxfi və xərci yoxdur; “göndərmək” məqsədini tamamlamır.
   - **Mailto/kopyala:** backend və məlumat saxlama yoxdur, real çatdırılma mümkündür; e-poçt proqramı olmayan cihazda zəif işləyə bilər və ünvan açıq olmalıdır.
   - **Backend:** ən rahat real submit-dir; spam, məxfilik, saxlanma, xərc və idarəetmə tələb edir.
8. **Tövsiyə:** indiki mərhələdə lokal davranışı əvvəlcədən açıq yazmaq və “Mətni kopyala”/“E-poçtda aç” seçimləri vermək; backend-i ayrıca məhsul layihəsi kimi qərarlaşdırmaq.
9. **Niyə AzToolBox üçün uyğundur:** pulsuz statik toolbox üçün spam və backend xərci yaranmır. İstifadəçi də submit-dən sonra aldadılmış hiss etmir.
10. **Dəqiq görünən davranış:** formun üstündə “Bu statik versiya rəyi serverə göndərmir” yazılır. Düymələr “Mətni kopyala” və, ünvan təsdiqlənibsə, “E-poçtda aç” olur; forma yalnız istifadəçi istədikdə təmizlənir.
11. **Bloklanan batch:** Batch 5-də wording/UX işi; digər əsas fix batch-ləri bloklamır.
12. **Qərar statusu:** əsasən **wording/documentation qərarıdır** və təhlükəsiz default kimi soruşmadan qəbul edilə bilər. Backend seçimi ayrıca əvvəlcədən təsdiq tələb edər.

## Qərar 11 — Animasiyalı şəkillər

1. **Qərar və qısa başlıq:** PD-11 — GIF/WebP animasiyası rədd edilməli, ilk kadr götürülməli, yoxsa saxlanmalıdır?
2. **Təsirlənən alətlər:** Image-to-PDF, şəkil sıxışdırıcı, şəkil metadata təmizləyici, resizer və digər Canvas əsaslı şəkil alətləri.
3. **Issue ID-ləri:** AZT-002, AZT-008, AZT-019, AZT-020.
4. **Cari davranış:** bəzi animasiyalı input-lar rədd edilir, bəziləri səssiz şəkildə yalnız ilk statik kadra çevrilir. İstifadəçi animasiyanın itəcəyini əvvəlcədən bilmir.
5. **Niyə qeyri-müəyyəndir:** bəzi alətlər üçün ilk kadr faydalı ola bilər, amma “şəkli sıxışdır/ölç” ifadəsi animasiyanın saxlanacağını düşündürür. Animasiyanı tam qorumaq ayrıca mürəkkəb pipeline tələb edir.
6. **Real seçimlər:** animasiyalı faylı aydın xətayla rədd etmək; ilk kadrı çıxarıb bunu açıq göstərmək; animasiyanı bütün kadrlarla qorumaq.
7. **Üstünlük və çatışmazlıqlar:**
   - **Rədd:** data itkisi yoxdur və sadədir; istifadəçi əməliyyatı edə bilmir.
   - **İlk kadr:** bəzi use-case üçün faydalıdır; istifadəçi diqqətsizdirsə animasiyanı itirə bilər.
   - **Tam qoruma:** ən güclü təcrübədir; performans, fayl ölçüsü, codec və test yükü böyükdür.
8. **Tövsiyə:** hazırda animasiyalı input-u aydın mesajla rədd etmək; gələcəkdə ayrıca “ilk kadrı çıxar” aləti əlavə edilə bilər.
9. **Niyə AzToolBox üçün uyğundur:** pulsuz sadə alətdə səssiz data itkisi qəbuledilməzdir. Rədd mesajı dürüst, proqnozlaşdırılan və mobil cihaz üçün təhlükəsizdir.
10. **Dəqiq görünən davranış:** animasiyalı GIF/WebP seçildikdə “Bu alət animasiyanı saxlamır. Statik PNG/JPG seçin” mesajı çıxır; heç bir nəticə və yanlış uğur göstərilmir.
11. **Bloklanan batch:** Batch 2-də Image-to-PDF; Batch 4-də şəkil format siyasəti; Batch 1-də compressor-un data-fidelity qaydası.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**, amma ən təhlükəsiz default olan aydın rədd ayrıca soruşmadan qəbul edilə bilər.

## Qərar 12 — Yanlış və böyük/kiçik hərfli slug-lar

1. **Qərar və qısa başlıq:** PD-12 — səhv URL PDF merger-ə düşməli, kiçik hərfə yönlənməli, yoxsa not-found göstərməlidir?
2. **Təsirlənən alətlər:** bütün tool route-ları, recent history və SEO metadata.
3. **Issue ID:** AZT-014.
4. **Cari davranış:** boş, naməlum və ya registri fərqli slug PDF merger-i açır və onu recent history-yə yazır.
5. **Niyə qeyri-müəyyəndir:** URL-lərin böyük/kiçik hərfə həssas olub-olmaması məhsul qaydasıdır. Avtomatik düzəliş rahat ola bilər, amma səhv linkləri gizlədir.
6. **Real seçimlər:** yalnız dəqiq uyğunluğu qəbul edib not-found göstərmək; məlum slug-un yalnız hərf registrini kiçildib redirect etmək; böyük/kiçik hərfi fərqsiz qəbul etmək.
7. **Üstünlük və çatışmazlıqlar:**
   - **Exact + not-found:** ən aydın və SEO baxımından təmizdir; istifadəçi typo-nu özü düzəldir.
   - **Lowercase redirect:** `JSON-FORMATTER` kimi sadə səhvi rahat düzəldir; redirect və canonical qaydası tələb edir.
   - **Case-insensitive render:** rahatdır; eyni səhifə üçün çox URL və analytics/SEO qarışıqlığı yaradır.
8. **Tövsiyə:** exact match; naməlum slug üçün real not-found. Gələcəkdə yalnız məlum slug-un registr fərqi üçün canonical lowercase redirect ayrıca əlavə edilə bilər.
9. **Niyə AzToolBox üçün uyğundur:** sadə və proqnozlaşdırılandır; səhv URL əlaqəsiz alət açmır və recent siyahısını çirkləndirmir.
10. **Dəqiq görünən davranış:** `/tool/?slug=unknown` “Alət tapılmadı” ekranı göstərir, PDF merger açılmır və recent history dəyişmir. Düzgün slug-lar əvvəlki kimi işləyir.
11. **Bloklanan batch:** Batch 3.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**, amma bu açıq bug olduğuna görə tövsiyə default kimi soruşmadan qəbul edilə bilər.

## Qərar 13 — AZ IBAN yoxlamasının səlahiyyət həddi

1. **Qərar və qısa başlıq:** PD-13 — alət yalnız quruluşu yoxlamalı, real bank siyahısını da bilməli, yoxsa onlayn mənbəyə qoşulmalıdır?
2. **Təsirlənən alətlər:** AZ IBAN validator.
3. **Issue ID:** AZT-007.
4. **Cari davranış:** AZ uzunluğu və checksum yoxlanır, amma bank identifikatorunun tələb olunan simvol quruluşu tam yoxlanmır. Buna görə sintetik, real bank olmayan dəyər “düzgün” görünə bilər.
5. **Niyə qeyri-müəyyəndir:** struktur və checksum doğruluğu hesabın və ya bankın həqiqətən mövcud olduğunu sübut etmir. Real bank siyahısı dəyişə və rəsmi, yenilənən mənbə tələb edə bilər.
6. **Real seçimlər:** yalnız dərc olunmuş struktur qaydasını lokal yoxlamaq; tətbiqə statik məlum-bank siyahısı əlavə etmək; rəsmi onlayn mənbədən bank/account doğrulamaq.
7. **Üstünlük və çatışmazlıqlar:**
   - **Struktur yoxlaması:** lokal, sürətli, məxfi və sabitdir; real bank/hesab mövcudluğunu demir.
   - **Statik bank siyahısı:** daha çox səhvi tutur; siyahı köhnələ və legitim yeni bankı rədd edə bilər.
   - **Onlayn yoxlama:** daha aktual ola bilər; privacy, internet, API, xərc və etibarlı mənbə problemi yaradır, hesab mövcudluğu yenə zəmanətli olmaya bilər.
8. **Tövsiyə:** rəsmi dərc olunmuş AZ BBAN strukturunu lokal yoxlamaq; nəticədə yalnız “format və checksum uyğundur” demək, bank/hesab mövcudluğu iddiası etməmək.
9. **Niyə AzToolBox üçün uyğundur:** layihənin lokal və məxfi işləmə prinsipini qoruyur, pulsuz API asılılığı yaratmır və Azərbaycan istifadəçisinə dürüst nəticə verir.
10. **Dəqiq görünən davranış:** rəqəmdən ibarət səhv bank identifikatoru rədd edilir. Uğurlu nəticə “IBAN formatı və checksum uyğundur. Bu yoxlama bankın və hesabın mövcudluğunu təsdiqləmir” yazır.
11. **Bloklanan batch:** Batch 2.
12. **Qərar statusu:** **implementasiyadan əvvəl tələb olunur**; dərc olunmuş qayda mənbə ilə təsdiqləndikdən sonra tövsiyə default kimi ayrıca soruşmadan qəbul edilə bilər.

## Hansı qərarlar istifadəçidən ayrıca seçim tələb edir?

### Mütləq təsdiq alınması tövsiyə olunanlar

- **PD-1:** nəticə bir PDF-dən ZIP-də çoxlu PDF-ə dəyişir.
- **PD-2:** səhifə sırası və təkrarları çıxış məzmununu dəyişir.
- **PD-5:** format, şəffaflıq və fayl xüsusiyyətləri üçün əsas məhsul siyasətidir.
- **PD-9:** yeni faiz rejimi və UI scope-u əlavə edir.

### Tövsiyə olunan default ilə ayrıca soruşmadan təhlükəsiz irəliləyə bilənlər

- **PD-3:** səhv ifadəni tam rədd etmək.
- **PD-4:** metadata-nı tam silmək və attribution əlavə etməmək.
- **PD-6:** böyük nəticəni “sıxışdırıldı” kimi göstərməmək.
- **PD-7:** insanın gördüyü qrafemləri saymaq.
- **PD-8:** JWT üçün daimi “validate edilmir” xəbərdarlığı.
- **PD-10:** feedback-in göndərilmədiyini əvvəlcədən demək və copy/mailto vermək.
- **PD-11:** animasiyanı səssiz itirmək əvəzinə input-u rədd etmək.
- **PD-12:** naməlum slug üçün not-found göstərmək.
- **PD-13:** yalnız struktur/checksum yoxlamaq və real bank/hesab iddiası etməmək — şərt: struktur qaydası etibarlı mənbədən təsdiqlənsin.

Bu default-lar təhlükəsizlik, dürüst nəticə və mövcud məhsul vədləri ilə uyğun olduğu üçün ayrıca məhsul seçimi tələb etmir. Yenə də implementation başlamazdan əvvəl qərar qeydi “approved default” kimi işarələnməlidir.

## Kompakt cavab vərəqi

Decision 1: Hər seçilmiş səhifə ayrıca PDF, hamısı bir ZIP-də.

Decision 2: Splitter/extractor sıra və təkrarları saxlasın; remover təkrarları bir dəfə saysın.

Decision 3: Tərs və qismən səhv səhifə ifadəsi tam rədd edilsin.

Decision 4: Bütün PDF Info metadata-sı və tarixlər silinsin, AzToolBox attribution əlavə edilməsin.

Decision 5: Format təhlükəsiz olduqda saxlanılsın; mümkün deyilsə istifadəçiyə aydın çıxış seçimi verilsin.

Decision 6: Böyük nəticə sıxışdırma uğuru sayılmasın; orijinal əsas seçim olsun.

Decision 7: Simvollar istifadəçinin gördüyü qrafemlər üzrə sayılsın.

Decision 8: JWT decoder-only qalsın və daimi “imza/expiry yoxlanmır” xəbərdarlığı göstərilsin.

Decision 9: Bir alətdə iki aydın rejim olsun: “Ədədin faizi” və “Faiz dəyişimi”.

Decision 10: Feedback lokal qalsın, əvvəlcədən açıqlansın, kopyala/mailto seçimləri verilsin.

Decision 11: Animasiyalı şəkillər aydın mesajla rədd edilsin.

Decision 12: Naməlum slug real not-found göstərsin və recent history-yə yazılmasın.

Decision 13: AZ IBAN lokal struktur və checksum üzrə yoxlansın; real bank/hesab mövcudluğu iddia edilməsin.
