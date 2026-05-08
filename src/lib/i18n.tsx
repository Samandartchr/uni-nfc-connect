import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "ru" | "kz" | "en" | "tr";

type Dict = Record<string, { ru: string; kz: string; en: string; tr: string }>;

const dict: Dict = {
  // Brand
  "brand.tagline": {
    ru: "Твой ключ к универу и новым знакомствам",
    kz: "Университетке және танысуға кілтің",
    en: "Your key to campus and new connections",
    tr: "Kampüse ve yeni tanışmalara anahtarın",
  },
  "brand.subline": {
    ru: "Карта в прошлом. Будущее — в твоём стиле.",
    kz: "Карта өткенде қалды. Болашақ — сенің стиліңде.",
    en: "Cards are history. The future is your style.",
    tr: "Kart geçmişte kaldı. Gelecek senin tarzında.",
  },

  // Nav
  "nav.home": { ru: "Главная", kz: "Басты", en: "Home", tr: "Ana sayfa" },
  "nav.feed": { ru: "Лента", kz: "Лента", en: "Feed", tr: "Akış" },
  "nav.messages": { ru: "Сообщения", kz: "Хабарлар", en: "Messages", tr: "Mesajlar" },
  "nav.profile": { ru: "Профиль", kz: "Профиль", en: "Profile", tr: "Profil" },
  "nav.grow": { ru: "Net & Grow", kz: "Net & Grow", en: "Net & Grow", tr: "Net & Grow" },
  "nav.signin": { ru: "Войти", kz: "Кіру", en: "Sign in", tr: "Giriş" },
  "nav.signup": { ru: "Регистрация", kz: "Тіркелу", en: "Sign up", tr: "Kayıt ol" },
  "nav.signout": { ru: "Выйти", kz: "Шығу", en: "Sign out", tr: "Çıkış" },

  // Landing
  "land.welcome": {
    ru: "WELCOME TO THE ECOSYSTEM",
    kz: "ЭКОЖҮЙЕГЕ ҚОШ КЕЛДІҢ",
    en: "WELCOME TO THE ECOSYSTEM",
    tr: "EKOSİSTEME HOŞ GELDİN",
  },
  "land.title.l1": {
    ru: "Карта в прошлом.",
    kz: "Карта өткенде.",
    en: "Cards are history.",
    tr: "Kart geçmişte.",
  },
  "land.title.l2": {
    ru: "Будущее — в твоём стиле.",
    kz: "Болашақ — сенің стиліңде.",
    en: "The future is your style.",
    tr: "Gelecek senin tarzında.",
  },
  "land.intro": {
    ru: "Знакомство за секунду. Просто прикоснись брелоком к телефону и поделись своим цифровым миром.",
    kz: "Бір секундта танысу. Брелокты телефонға тигіз де, өз цифрлық әлеміңмен бөліс.",
    en: "Meet someone in a second. Tap your keychain to a phone and share your digital world.",
    tr: "Bir saniyede tanış. Anahtarlığını telefona dokundur ve dijital dünyanı paylaş.",
  },
  "land.cta.order": {
    ru: "Заказать брелок",
    kz: "Брелок тапсырыс беру",
    en: "Order a keychain",
    tr: "Anahtarlık sipariş et",
  },
  "land.cta.more": { ru: "Узнать больше", kz: "Толығырақ", en: "Learn more", tr: "Daha fazla" },
  "land.cta.start": {
    ru: "Начать сейчас",
    kz: "Қазір бастау",
    en: "Get started",
    tr: "Hemen başla",
  },
  "land.demo.heading": {
    ru: "Знакомство за секунду",
    kz: "Бір секундта танысу",
    en: "Meet in a second",
    tr: "Bir saniyede tanış",
  },
  "land.demo.sub": {
    ru: "Прикоснись брелоком к телефону — профиль откроется автоматически.",
    kz: "Брелокты телефонға тигіз — профиль автоматты ашылады.",
    en: "Tap the keychain to a phone — the profile opens automatically.",
    tr: "Anahtarlığı telefona dokundur — profil otomatik açılır.",
  },
  "land.add": {
    ru: "Добавить в друзья",
    kz: "Дос ретінде қосу",
    en: "Add friend",
    tr: "Arkadaş ekle",
  },
  "land.decline": { ru: "Отказаться", kz: "Бас тарту", en: "Decline", tr: "Reddet" },

  "land.how.title": {
    ru: "Как это работает?",
    kz: "Қалай жұмыс істейді?",
    en: "How does it work?",
    tr: "Nasıl çalışır?",
  },
  "land.how.1.t": {
    ru: "Вход в один тап",
    kz: "Бір тиісумен кіру",
    en: "One-tap entry",
    tr: "Tek dokunuşla giriş",
  },
  "land.how.1.d": {
    ru: "Пройди через турникет, просто приложив брелок к ридеру.",
    kz: "Турникеттен брелокты тигізіп өт.",
    en: "Walk through the turnstile by tapping your keychain to the reader.",
    tr: "Anahtarlığı okuyucuya dokundurarak turnikeden geç.",
  },
  "land.how.2.t": {
    ru: "Smart-нетворкинг",
    kz: "Smart-нетворкинг",
    en: "Smart networking",
    tr: "Akıllı networking",
  },
  "land.how.2.d": {
    ru: "Встретил интересного человека? Пусть приложит твой брелок к телефону.",
    kz: "Қызықты адаммен таныстың ба? Брелокты тигізсін.",
    en: "Met someone interesting? Let them tap your keychain to their phone.",
    tr: "İlginç biriyle mi tanıştın? Anahtarlığını telefonuna dokundursun.",
  },
  "land.how.3.t": {
    ru: "Авто-профиль",
    kz: "Авто-профиль",
    en: "Auto-profile",
    tr: "Otomatik profil",
  },
  "land.how.3.d": {
    ru: "Профиль откроется автоматически. Осталось нажать «Добавить в друзья».",
    kz: "Профиль автоматты ашылады. Қалғаны — «Дос ретінде қосу».",
    en: "The profile opens automatically. Just tap “Add friend”.",
    tr: "Profil otomatik açılır. Geriye sadece “Arkadaş ekle” kalır.",
  },

  "land.feed.label": {
    ru: "LIVE ECOSYSTEM",
    kz: "ТІРІ ЭКОЖҮЙЕ",
    en: "LIVE ECOSYSTEM",
    tr: "CANLI EKOSİSTEM",
  },
  "land.feed.title": {
    ru: "Интеллектуальная лента событий",
    kz: "Зияткерлік оқиғалар лентасы",
    en: "An intelligent activity feed",
    tr: "Akıllı etkinlik akışı",
  },
  "land.feed.sub": {
    ru: "Мы анализируем интересы и цели — лента подсказывает, кому стоит откликнуться.",
    kz: "Қызығушылық пен мақсаттарды талдап, лента кіммен сөйлесуді ұсынады.",
    en: "We analyze interests and goals — the feed suggests who to reach out to.",
    tr: "İlgi alanlarını ve hedefleri analiz ediyoruz — akış kime ulaşacağını önerir.",
  },

  "land.cta.final.t": {
    ru: "Готов стать частью будущего?",
    kz: "Болашақтың бір бөлшегі болуға дайынсың ба?",
    en: "Ready to join the future?",
    tr: "Geleceğin parçası olmaya hazır mısın?",
  },
  "land.cta.final.s": {
    ru: "Создай профиль за минуту и присоединяйся к университетской сети.",
    kz: "Бір минутта профиль жаса да, желіге қосыл.",
    en: "Create a profile in a minute and join the campus network.",
    tr: "Bir dakikada profil oluştur ve kampüs ağına katıl.",
  },

  // Footer
  "foot.platform": { ru: "ПЛАТФОРМА", kz: "ПЛАТФОРМА", en: "PLATFORM", tr: "PLATFORM" },
  "foot.about": { ru: "О проекте", kz: "Жоба туралы", en: "About", tr: "Hakkında" },
  "foot.contact": { ru: "Контакты", kz: "Байланыс", en: "Contact", tr: "İletişim" },
  "foot.privacy": { ru: "Приватность", kz: "Құпиялық", en: "Privacy", tr: "Gizlilik" },
  "foot.copy": {
    ru: "© 2026 UniConnect. Все права защищены.",
    kz: "© 2026 UniConnect. Барлық құқықтар қорғалған.",
    en: "© 2026 UniConnect. All rights reserved.",
    tr: "© 2026 UniConnect. Tüm hakları saklıdır.",
  },

  // Auth
  "auth.signin.title": {
    ru: "С возвращением",
    kz: "Қайта оралдың!",
    en: "Welcome back",
    tr: "Tekrar hoş geldin",
  },
  "auth.signin.sub": {
    ru: "Войди, чтобы продолжить нетворкинг.",
    kz: "Желіге жалғастыру үшін кір.",
    en: "Sign in to keep networking.",
    tr: "Networking'e devam etmek için giriş yap.",
  },
  "auth.signup.title": {
    ru: "Создай профиль",
    kz: "Профиль жаса",
    en: "Create your profile",
    tr: "Profilini oluştur",
  },
  "auth.signup.sub": {
    ru: "Минута — и ты в сети университета.",
    kz: "Бір минут — желідесің.",
    en: "One minute and you're on the campus network.",
    tr: "Bir dakikada kampüs ağındasın.",
  },
  "auth.email": { ru: "Email", kz: "Email", en: "Email", tr: "E-posta" },
  "auth.password": { ru: "Пароль", kz: "Құпиясөз", en: "Password", tr: "Şifre" },
  "auth.fullname": { ru: "Имя и фамилия", kz: "Аты-жөнің", en: "Full name", tr: "Ad soyad" },
  "auth.submit.in": { ru: "Войти", kz: "Кіру", en: "Sign in", tr: "Giriş yap" },
  "auth.submit.up": {
    ru: "Создать аккаунт",
    kz: "Аккаунт жасау",
    en: "Create account",
    tr: "Hesap oluştur",
  },
  "auth.toggle.in": {
    ru: "Уже есть аккаунт? Войти",
    kz: "Аккаунт бар ма? Кіру",
    en: "Already have an account? Sign in",
    tr: "Hesabın var mı? Giriş yap",
  },
  "auth.toggle.up": {
    ru: "Нет аккаунта? Создать",
    kz: "Аккаунт жоқ па? Жасау",
    en: "No account? Create one",
    tr: "Hesabın yok mu? Oluştur",
  },

  // Profile
  "prof.faculty": { ru: "Факультет", kz: "Факультет", en: "Faculty", tr: "Fakülte" },
  "prof.course": { ru: "Курс", kz: "Курс", en: "Year", tr: "Sınıf" },
  "prof.about": { ru: "О себе", kz: "Өзі туралы", en: "About", tr: "Hakkında" },
  "prof.interests": { ru: "Интересы", kz: "Қызығушылықтар", en: "Interests", tr: "İlgi alanları" },
  "prof.goals": { ru: "Цели", kz: "Мақсаттар", en: "Goals", tr: "Hedefler" },
  "prof.visitors": {
    ru: "Посетители профиля",
    kz: "Профиль қонақтары",
    en: "Profile visitors",
    tr: "Profil ziyaretçileri",
  },
  "prof.new": { ru: "новых", kz: "жаңа", en: "new", tr: "yeni" },
  "prof.edit": { ru: "Редактировать", kz: "Өңдеу", en: "Edit", tr: "Düzenle" },
  "prof.save": { ru: "Сохранить", kz: "Сақтау", en: "Save", tr: "Kaydet" },
  "prof.cancel": { ru: "Отмена", kz: "Болдырмау", en: "Cancel", tr: "İptal" },
  "prof.add.friend": {
    ru: "Добавить в друзья",
    kz: "Дос ретінде қосу",
    en: "Add friend",
    tr: "Arkadaş ekle",
  },
  "prof.pending": {
    ru: "Запрос отправлен",
    kz: "Сұраныс жіберілді",
    en: "Request sent",
    tr: "İstek gönderildi",
  },
  "prof.friends": {
    ru: "Вы друзья",
    kz: "Сіздер достарсыздар",
    en: "You are friends",
    tr: "Arkadaşsınız",
  },
  "prof.match": {
    ru: "Похожая цель!",
    kz: "Ұқсас мақсат!",
    en: "Similar goal!",
    tr: "Benzer hedef!",
  },
  "prof.scan": {
    ru: "Сканировать NFC / Открыть профиль",
    kz: "NFC сканерлеу / Профиль ашу",
    en: "Scan NFC / Open profile",
    tr: "NFC tara / Profili aç",
  },
  "prof.found.key": {
    ru: "Если вы нашли чужой брелок, приложите его к телефону.",
    kz: "Бөтен брелок таптыңыз ба — телефонға тигізіңіз.",
    en: "Found someone's keychain? Tap it to your phone.",
    tr: "Birinin anahtarlığını mı buldun? Telefonuna dokundur.",
  },

  // Feed
  "feed.title": { ru: "Лента", kz: "Лента", en: "Feed", tr: "Akış" },
  "feed.placeholder": {
    ru: "Что нового в твоём проекте?",
    kz: "Жобаңда не жаңалық бар?",
    en: "What's new in your project?",
    tr: "Projende ne var ne yok?",
  },
  "feed.post": { ru: "Опубликовать", kz: "Жариялау", en: "Post", tr: "Paylaş" },
  "feed.empty": {
    ru: "Пока пусто. Стань первым автором ленты!",
    kz: "Әзірге бос. Лентаның бірінші авторы бол!",
    en: "Nothing yet. Be the first to post!",
    tr: "Henüz boş. İlk paylaşan sen ol!",
  },

  // Messages
  "msg.title": { ru: "Сообщения", kz: "Хабарлар", en: "Messages", tr: "Mesajlar" },
  "msg.mutuals": {
    ru: "MUTUALS ONLY",
    kz: "ТЕК ӨЗАРА ДОСТАР",
    en: "MUTUALS ONLY",
    tr: "SADECE KARŞILIKLI",
  },
  "msg.head": {
    ru: "Общайтесь с комфортом",
    kz: "Жайлы қарым-қатынас",
    en: "Chat with comfort",
    tr: "Rahatça sohbet et",
  },
  "msg.body": {
    ru: "Начать диалог можно только если обе стороны добавили друг друга в друзья. Ваша приватность — наш приоритет.",
    kz: "Тек өзара дос болғанда ғана хабар жазуға болады. Құпиялығың — біздің басымдық.",
    en: "You can chat only when both sides have added each other. Your privacy is our priority.",
    tr: "Sohbet ancak iki taraf da arkadaş ekleyince başlar. Gizliliğin önceliğimiz.",
  },
  "msg.empty": {
    ru: "У тебя пока нет друзей. Найди их через NFC или ленту!",
    kz: "Әзірге досың жоқ. NFC немесе лента арқылы тап!",
    en: "No friends yet. Find them via NFC or the feed!",
    tr: "Henüz arkadaşın yok. NFC veya akıştan bul!",
  },
  "msg.coming": {
    ru: "Чат скоро откроется",
    kz: "Чат жуырда ашылады",
    en: "Chat coming soon",
    tr: "Sohbet yakında",
  },

  // NFC
  "nfc.title": { ru: "NFC-демо", kz: "NFC-демо", en: "NFC demo", tr: "NFC demo" },
  "nfc.tap": {
    ru: "Тапни брелок",
    kz: "Брелокқа тигіз",
    en: "Tap the keychain",
    tr: "Anahtarlığa dokun",
  },
  "nfc.scanning": { ru: "Сканирую…", kz: "Сканерлеп жатырмын…", en: "Scanning…", tr: "Taranıyor…" },
  "nfc.success": {
    ru: "Профиль найден!",
    kz: "Профиль табылды!",
    en: "Profile found!",
    tr: "Profil bulundu!",
  },

  // Net & Grow
  "grow.title": { ru: "Net & Grow", kz: "Net & Grow", en: "Net & Grow", tr: "Net & Grow" },
  "grow.sub": {
    ru: "Найди партнёра по целям и интересам.",
    kz: "Мақсат пен қызығушылық бойынша серіктес тап.",
    en: "Find a partner by goals and interests.",
    tr: "Hedef ve ilgi alanına göre ortak bul.",
  },
  "grow.tab.goals": { ru: "По целям", kz: "Мақсаттар", en: "By goals", tr: "Hedeflere göre" },
  "grow.tab.interests": {
    ru: "По интересам",
    kz: "Қызығушылықтар",
    en: "By interests",
    tr: "İlgi alanına göre",
  },
  "grow.search.goals": {
    ru: "Поиск: ICPC, Startup, IELTS…",
    kz: "Іздеу: ICPC, Startup, IELTS…",
    en: "Search: ICPC, Startup, IELTS…",
    tr: "Ara: ICPC, Startup, IELTS…",
  },
  "grow.search.tags": {
    ru: "Поиск тега: #coding, #debate…",
    kz: "Тег іздеу: #coding, #debate…",
    en: "Search tags: #coding, #debate…",
    tr: "Etiket ara: #coding, #debate…",
  },
  "grow.match": { ru: "Сәйкестік", kz: "Сәйкестік", en: "Match", tr: "Eşleşme" },
  "grow.similar": {
    ru: "Похожая цель!",
    kz: "Сізге ұқсас мақсат!",
    en: "Similar goal!",
    tr: "Benzer hedef!",
  },
  "grow.smart": { ru: "Smart Match", kz: "Smart Match", en: "Smart Match", tr: "Smart Match" },
  "grow.smart.title": {
    ru: "Топ рекомендованных партнёров",
    kz: "Үздік ұсынылған серіктестер",
    en: "Top recommended partners",
    tr: "En iyi önerilen ortaklar",
  },
  "grow.invite": {
    ru: "Пригласить к сотрудничеству",
    kz: "Бірлесуге шақыру",
    en: "Invite to collaborate",
    tr: "İş birliğine davet et",
  },
  "grow.invited": {
    ru: "Запрос отправлен",
    kz: "Сұраныс жіберілді",
    en: "Request sent",
    tr: "İstek gönderildi",
  },
  "grow.empty": {
    ru: "Используй время с пользой! Добавь свою цель и найди партнёра.",
    kz: "Бос уақытыңды тиімді пайдалан! Өз мақсатыңды қос та, серіктес тап.",
    en: "Use your time well! Add a goal and find a partner.",
    tr: "Zamanını verimli kullan! Hedef ekle ve ortak bul.",
  },
  "grow.tag.people": {
    ru: "интересуются этим",
    kz: "осыған қызығады",
    en: "are interested in this",
    tr: "bununla ilgileniyor",
  },
  "grow.level": { ru: "Уровень", kz: "Деңгей", en: "Level", tr: "Seviye" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ru");

  useEffect(() => {
    const stored = (typeof window !== "undefined" &&
      localStorage.getItem("uc.lang")) as Lang | null;
    if (stored === "ru" || stored === "kz" || stored === "en" || stored === "tr")
      setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("uc.lang", l);
  };

  const t = (key: string) => dict[key]?.[lang] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be inside I18nProvider");
  return ctx;
}
