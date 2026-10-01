export interface DeveloperConfig {
  name: string;
  role: string;
  degree: string;
  department: string;
  institution: string;
  email: string;
  github: string;
  linkedin: string;
  portfolio: string;
  focusAreas: string[];
}

export interface ProductConfig {
  name: string;
  tagline: string;
  version: string;
  copyrightYear: number;
  description: string;
}

export interface MotivationalQuote {
  id: number;
  quote: string;
  author: string;
}

export const DEVELOPER_INFO: DeveloperConfig = {
  name: 'Kalki Tarun',
  role: 'Full-Stack & AI/ML Engineer',
  degree: 'B.Tech — Computer Science & Engineering',
  department: 'Artificial Intelligence & Machine Learning',
  institution: 'R.V.R. & J.C. College of Engineering',
  email: 'kalkitarun@example.com',
  github: 'https://github.com/kalkitarun',
  linkedin: 'https://linkedin.com/in/kalkitarun',
  portfolio: 'https://kalkitarun.dev',
  focusAreas: [
    'Artificial Intelligence',
    'Machine Learning',
    'Full-Stack Development',
    'Data Engineering',
    'Research & Project Development',
  ],
};

export const PRODUCT_INFO: ProductConfig = {
  name: 'HabitFlow',
  tagline: 'Daily Routines & Habit Tracking',
  version: '1.0.0',
  copyrightYear: 2026,
  description:
    'HabitFlow is a modern habit-tracking platform designed to help you build consistent daily routines, understand behavioral momentum, and make meaningful progress through schedule-aware data tracking.',
};

export const MOTIVATIONAL_QUOTES: MotivationalQuote[] = [
  {
    id: 1,
    quote: 'Small disciplines repeated consistently every day lead to remarkable results.',
    author: 'HabitFlow Principle',
  },
  {
    id: 2,
    quote: 'Success is the sum of small efforts, repeated day in and day out.',
    author: 'Robert Collier',
  },
  {
    id: 3,
    quote: 'Discipline creates the freedom that motivation cannot.',
    author: 'Jocko Willink',
  },
  {
    id: 4,
    quote: 'Small progress every day is still tremendous progress.',
    author: 'Atomic Habits',
  },
  {
    id: 5,
    quote: 'Consistency beats intensity when intensity is temporary.',
    author: 'Productivity Rule',
  },
  {
    id: 6,
    quote: 'Your daily habits shape your future identity.',
    author: 'James Clear',
  },
  {
    id: 7,
    quote: 'Focus on what you can control and complete today.',
    author: 'Stoic Wisdom',
  },
  {
    id: 8,
    quote: 'One completed habit is better than ten planned routines.',
    author: 'HabitFlow Mindset',
  },
  {
    id: 9,
    quote: 'The secret of getting ahead is simply getting started.',
    author: 'Mark Twain',
  },
  {
    id: 10,
    quote: 'Make your positive habits obvious, attractive, easy, and satisfying.',
    author: 'James Clear',
  },
  {
    id: 11,
    quote: 'Progress comes from showing up consistently, especially on difficult days.',
    author: 'Habit Flow Insight',
  },
  {
    id: 12,
    quote: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
  },
];

/**
 * Returns a random quote from the collection, avoiding immediate repetition.
 */
export const getRandomQuote = (currentId?: number): MotivationalQuote => {
  const available = currentId !== undefined
    ? MOTIVATIONAL_QUOTES.filter((q) => q.id !== currentId)
    : MOTIVATIONAL_QUOTES;
  const randomIndex = Math.floor(Math.random() * available.length);
  return available[randomIndex] || MOTIVATIONAL_QUOTES[0];
};
