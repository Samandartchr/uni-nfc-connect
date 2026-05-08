export interface MockProfile {
  id: string;
  full_name: string;
  faculty: string;
  course: string;
  about: string;
  interests: string[];
  goals: string[];
  is_pro: boolean;
}

export interface MockPost {
  id: string;
  author_id: string;
  author_name: string;
  faculty: string;
  content: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export const myProfile: MockProfile = {
  id: "demo-user",
  full_name: "Айдана Сериккызы",
  faculty: "Computer Science",
  course: "3",
  about: "Студентка КБТУ. Люблю AI, чай и долгие дискуссии о будущем образования.",
  interests: ["AI", "design", "chess", "startup"],
  goals: ["English B1→B2", "Startup MVP", "ICPC"],
  is_pro: true,
};

export const peers: MockProfile[] = [
  {
    id: "p1",
    full_name: "Алексей Романов",
    faculty: "Software Engineering",
    course: "4",
    about: "Запускаю edtech-стартап. Ищу со-фаундера.",
    interests: ["startup", "AI", "product"],
    goals: ["Startup MVP", "Pitch Demo Day", "English B1→B2"],
    is_pro: true,
  },
  {
    id: "p2",
    full_name: "Елена Волкова",
    faculty: "Linguistics",
    course: "2",
    about: "Киноклуб, переводы, IELTS 7.5.",
    interests: ["cinema", "languages", "debate"],
    goals: ["IELTS 8.0", "English B1→B2"],
    is_pro: false,
  },
  {
    id: "p3",
    full_name: "Ержан Қайратұлы",
    faculty: "Mathematics",
    course: "3",
    about: "ICPC региональный финалист. Ищу команду на следующий сезон.",
    interests: ["coding", "math", "chess"],
    goals: ["ICPC", "Google Internship"],
    is_pro: false,
  },
  {
    id: "p4",
    full_name: "Динара Аман",
    faculty: "Design",
    course: "2",
    about: "UX-дизайнер. Ищу инженеров для pet-проектов.",
    interests: ["design", "AI", "art"],
    goals: ["Startup MVP", "Portfolio"],
    is_pro: true,
  },
  {
    id: "p5",
    full_name: "Тимур Бекжан",
    faculty: "Physics",
    course: "4",
    about: "Research в области квантовых вычислений.",
    interests: ["research", "AI", "physics"],
    goals: ["Master Abroad", "Research Paper"],
    is_pro: false,
  },
  {
    id: "p6",
    full_name: "UniLab Club",
    faculty: "Студенческий клуб",
    course: "—",
    about: "Открытые лекции и хакатоны.",
    interests: ["AI", "research", "networking"],
    goals: ["Hackathon", "Open Lecture"],
    is_pro: true,
  },
];

export const initialPosts: MockPost[] = [
  {
    id: "post-1",
    author_id: "p1",
    author_name: "Алексей Романов",
    faculty: "Software Engineering",
    content:
      "Запускаем закрытое бета-тестирование AI-планировщика для студентов. Кому интересно — пишите!",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes_count: 24,
    comments_count: 5,
  },
  {
    id: "post-2",
    author_id: "p2",
    author_name: "Елена Волкова",
    faculty: "Linguistics",
    content:
      "Встреча киноклуба в этот четверг! Обсуждаем «Интерстеллар». Ждём всех в 18:00 в коворкинге.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    likes_count: 12,
    comments_count: 3,
  },
  {
    id: "post-3",
    author_id: "p6",
    author_name: "UniLab Club",
    faculty: "Студенческий клуб",
    content: "Открытая лекция: «Этика в нейросетях». Регистрация по ссылке в профиле.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    likes_count: 41,
    comments_count: 8,
  },
  {
    id: "post-4",
    author_id: "p3",
    author_name: "Ержан Қайратұлы",
    faculty: "Mathematics",
    content: "Ищу 2-х человек в команду на ICPC. Тренировки по выходным. DM!",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    likes_count: 18,
    comments_count: 6,
  },
];

export const friends: { id: string; name: string; faculty: string; lastMessage: string }[] = [
  {
    id: "p1",
    name: "Алексей Романов",
    faculty: "Software Engineering",
    lastMessage: "Скинул бриф проекта 👌",
  },
  { id: "p4", name: "Динара Аман", faculty: "Design", lastMessage: "Готова созвониться завтра" },
  { id: "p3", name: "Ержан Қайратұлы", faculty: "Mathematics", lastMessage: "Тренировка в 19:00" },
];
