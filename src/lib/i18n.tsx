import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "ru" | "kz";

type Dict = Record<string, { ru: string; kz: string }>;

const dict: Dict = {
  // Brand
  "brand.tagline": { ru: "Твой ключ к универу и новым знакомствам", kz: "Университетке және танысуға кілтің" },
  "brand.subline": { ru: "Карта в прошлом. Будущее — в твоём стиле.", kz: "Карта өткенде қалды. Болашақ — сенің стиліңде." },

  // Nav
  "nav.home": { ru: "Главная", kz: "Басты" },
  "nav.feed": { ru: "Лента", kz: "Лента" },
  "nav.messages": { ru: "Сообщения", kz: "Хабарлар" },
  "nav.profile": { ru: "Профиль", kz: "Профиль" },
  "nav.signin": { ru: "Войти", kz: "Кіру" },
  "nav.signup": { ru: "Регистрация", kz: "Тіркелу" },
  "nav.signout": { ru: "Выйти", kz: "Шығу" },

  // Landing
  "land.welcome": { ru: "WELCOME TO THE ECOSYSTEM", kz: "ЭКОЖҮЙЕГЕ ҚОШ КЕЛДІҢ" },
  "land.title.l1": { ru: "Карта в прошлом.", kz: "Карта өткенде." },
  "land.title.l2": { ru: "Будущее — в твоём стиле.", kz: "Болашақ — сенің стиліңде." },
  "land.intro": { ru: "Знакомство за секунду. Просто прикоснись брелоком к телефону и поделись своим цифровым миром.", kz: "Бір секундта танысу. Брелокты телефонға тигіз де, өз цифрлық әлеміңмен бөліс." },
  "land.cta.order": { ru: "Заказать брелок", kz: "Брелок тапсырыс беру" },
  "land.cta.more": { ru: "Узнать больше", kz: "Толығырақ" },
  "land.cta.start": { ru: "Начать сейчас", kz: "Қазір бастау" },
  "land.demo.heading": { ru: "Знакомство за секунду", kz: "Бір секундта танысу" },
  "land.demo.sub": { ru: "Прикоснись брелоком к телефону — профиль откроется автоматически.", kz: "Брелокты телефонға тигіз — профиль автоматты ашылады." },
  "land.add": { ru: "Добавить в друзья", kz: "Дос ретінде қосу" },
  "land.decline": { ru: "Отказаться", kz: "Бас тарту" },

  "land.how.title": { ru: "Как это работает?", kz: "Қалай жұмыс істейді?" },
  "land.how.1.t": { ru: "Вход в один тап", kz: "Бір тиісумен кіру" },
  "land.how.1.d": { ru: "Пройди через турникет, просто приложив брелок к ридеру.", kz: "Турникеттен брелокты тигізіп өт." },
  "land.how.2.t": { ru: "Smart-нетворкинг", kz: "Smart-нетворкинг" },
  "land.how.2.d": { ru: "Встретил интересного человека? Пусть приложит твой брелок к телефону.", kz: "Қызықты адаммен таныстың ба? Брелокты тигізсін." },
  "land.how.3.t": { ru: "Авто-профиль", kz: "Авто-профиль" },
  "land.how.3.d": { ru: "Профиль откроется автоматически. Осталось нажать «Добавить в друзья».", kz: "Профиль автоматты ашылады. Қалғаны — «Дос ретінде қосу»." },

  "land.feed.label": { ru: "LIVE ECOSYSTEM", kz: "ТІРІ ЭКОЖҮЙЕ" },
  "land.feed.title": { ru: "Интеллектуальная лента событий", kz: "Зияткерлік оқиғалар лентасы" },
  "land.feed.sub": { ru: "Мы анализируем интересы и цели — лента подсказывает, кому стоит откликнуться.", kz: "Қызығушылық пен мақсаттарды талдап, лента кіммен сөйлесуді ұсынады." },

  "land.cta.final.t": { ru: "Готов стать частью будущего?", kz: "Болашақтың бір бөлшегі болуға дайынсың ба?" },
  "land.cta.final.s": { ru: "Создай профиль за минуту и присоединяйся к университетской сети.", kz: "Бір минутта профиль жаса да, желіге қосыл." },

  // Footer
  "foot.platform": { ru: "ПЛАТФОРМА", kz: "ПЛАТФОРМА" },
  "foot.about": { ru: "О проекте", kz: "Жоба туралы" },
  "foot.contact": { ru: "Контакты", kz: "Байланыс" },
  "foot.privacy": { ru: "Приватность", kz: "Құпиялық" },
  "foot.copy": { ru: "© 2026 UniConnect. Все права защищены.", kz: "© 2026 UniConnect. Барлық құқықтар қорғалған." },

  // Auth
  "auth.signin.title": { ru: "С возвращением", kz: "Қайта оралдың!" },
  "auth.signin.sub": { ru: "Войди, чтобы продолжить нетворкинг.", kz: "Желіге жалғастыру үшін кір." },
  "auth.signup.title": { ru: "Создай профиль", kz: "Профиль жаса" },
  "auth.signup.sub": { ru: "Минута — и ты в сети университета.", kz: "Бір минут — желідесің." },
  "auth.email": { ru: "Email", kz: "Email" },
  "auth.password": { ru: "Пароль", kz: "Құпиясөз" },
  "auth.fullname": { ru: "Имя и фамилия", kz: "Аты-жөнің" },
  "auth.submit.in": { ru: "Войти", kz: "Кіру" },
  "auth.submit.up": { ru: "Создать аккаунт", kz: "Аккаунт жасау" },
  "auth.toggle.in": { ru: "Уже есть аккаунт? Войти", kz: "Аккаунт бар ма? Кіру" },
  "auth.toggle.up": { ru: "Нет аккаунта? Создать", kz: "Аккаунт жоқ па? Жасау" },

  // Profile
  "prof.faculty": { ru: "Факультет", kz: "Факультет" },
  "prof.course": { ru: "Курс", kz: "Курс" },
  "prof.about": { ru: "О себе", kz: "Өзі туралы" },
  "prof.interests": { ru: "Интересы", kz: "Қызығушылықтар" },
  "prof.goals": { ru: "Цели", kz: "Мақсаттар" },
  "prof.visitors": { ru: "Посетители профиля", kz: "Профиль қонақтары" },
  "prof.new": { ru: "новых", kz: "жаңа" },
  "prof.edit": { ru: "Редактировать", kz: "Өңдеу" },
  "prof.save": { ru: "Сохранить", kz: "Сақтау" },
  "prof.cancel": { ru: "Отмена", kz: "Болдырмау" },
  "prof.add.friend": { ru: "Добавить в друзья", kz: "Дос ретінде қосу" },
  "prof.pending": { ru: "Запрос отправлен", kz: "Сұраныс жіберілді" },
  "prof.friends": { ru: "Вы друзья", kz: "Сіздер достарсыздар" },
  "prof.match": { ru: "Похожая цель!", kz: "Ұқсас мақсат!" },
  "prof.scan": { ru: "Сканировать NFC / Открыть профиль", kz: "NFC сканерлеу / Профиль ашу" },
  "prof.found.key": { ru: "Если вы нашли чужой брелок, приложите его к телефону.", kz: "Бөтен брелок таптыңыз ба — телефонға тигізіңіз." },

  // Feed
  "feed.title": { ru: "Лента", kz: "Лента" },
  "feed.placeholder": { ru: "Что нового в твоём проекте?", kz: "Жобаңда не жаңалық бар?" },
  "feed.post": { ru: "Опубликовать", kz: "Жариялау" },
  "feed.empty": { ru: "Пока пусто. Стань первым автором ленты!", kz: "Әзірге бос. Лентаның бірінші авторы бол!" },

  // Messages
  "msg.title": { ru: "Сообщения", kz: "Хабарлар" },
  "msg.mutuals": { ru: "MUTUALS ONLY", kz: "ТЕК ӨЗАРА ДОСТАР" },
  "msg.head": { ru: "Общайтесь с комфортом", kz: "Жайлы қарым-қатынас" },
  "msg.body": { ru: "Начать диалог можно только если обе стороны добавили друг друга в друзья. Ваша приватность — наш приоритет.", kz: "Тек өзара дос болғанда ғана хабар жазуға болады. Құпиялығың — біздің басымдық." },
  "msg.empty": { ru: "У тебя пока нет друзей. Найди их через NFC или ленту!", kz: "Әзірге досың жоқ. NFC немесе лента арқылы тап!" },
  "msg.coming": { ru: "Чат скоро откроется", kz: "Чат жуырда ашылады" },

  // NFC
  "nfc.title": { ru: "NFC-демо", kz: "NFC-демо" },
  "nfc.tap": { ru: "Тапни брелок", kz: "Брелокқа тигіз" },
  "nfc.scanning": { ru: "Сканирую…", kz: "Сканерлеп жатырмын…" },
  "nfc.success": { ru: "Профиль найден!", kz: "Профиль табылды!" },
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
    const stored = (typeof window !== "undefined" && localStorage.getItem("uc.lang")) as Lang | null;
    if (stored === "ru" || stored === "kz") setLangState(stored);
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
