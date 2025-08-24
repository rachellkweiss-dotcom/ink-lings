export interface JournalCategory {
  id: string;
  name: string;
  description: string;
  prompt: string;
  image: string;
}

export const journalCategories: JournalCategory[] = [
  {
    id: "personal-reflection",
    name: "Personal Reflection",
    description: "identity, moods, inner thoughts",
    prompt: "What did you learn about yourself today?",
    image: "/personal-reflection.jpg"
  },
  {
    id: "playful-whimsical",
    name: "Playful / Whimsical",
    description: "light, silly, imaginative prompts",
    prompt: "If you had a superpower for a day, what would you do?",
    image: "/playful-whimsical.jpg"
  },
  {
    id: "relationships",
    name: "Relationships",
    description: "friends, family, love, community",
    prompt: "Who made you feel seen or cared for this week?",
    image: "/relationships.jpg"
  },
  {
    id: "work-craft",
    name: "Work / Craft",
    description: "career, projects, skills, productivity",
    prompt: "What task today gave you energy instead of draining it?",
    image: "/work-craft.jpg"
  },
  {
    id: "creativity-arts",
    name: "Creativity / Arts",
    description: "music, writing, painting, expression",
    prompt: "What's one idea you'd sketch, paint, or write if time didn't matter?",
    image: "/creativity-arts.jpg"
  },
  {
    id: "memory-past",
    name: "Memory / Past",
    description: "childhood, nostalgia, life lessons",
    prompt: "What childhood smell instantly takes you back?",
    image: "/memory-past.jpg"
  },
  {
    id: "philosophy-values",
    name: "Philosophy / Values",
    description: "ethics, meaning, purpose",
    prompt: "What principle do you try to live by every day?",
    image: "/philosophy-values.jpg"
  },
  {
    id: "nature-senses",
    name: "Nature / Senses",
    description: "outdoors, seasons, sensory awareness",
    prompt: "What did you notice outside today that most people overlooked?",
    image: "/nature-senses.jpg"
  },
  {
    id: "travel-place",
    name: "Travel / Place",
    description: "new places, homes, cultural reflections",
    prompt: "What's one place that feels like home, even if it isn't?",
    image: "/travel-place.jpg"
  },
  {
    id: "health-body",
    name: "Health / Body",
    description: "fitness, diet, energy, wellness",
    prompt: "When did your body feel strongest today?",
    image: "/health-body.jpg"
  },
  {
    id: "money-life-admin",
    name: "Money / Life Admin",
    description: "finances, responsibilities, daily structure",
    prompt: "What's one small step you could take to ease tomorrow's responsibilities?",
    image: "/money-life-admin.jpg"
  },
  {
    id: "risk-adventure",
    name: "Risk / Adventure",
    description: "courage, exploration, stepping outside comfort",
    prompt: "What's the last risk you took that made you proud?",
    image: "/risk-adventure.jpg"
  },
  {
    id: "tech-media",
    name: "Tech / Media",
    description: "digital life, influence of technology, social media",
    prompt: "What's the best or worst thing you saw online today?",
    image: "/tech-media.jpg"
  },
  {
    id: "wildcard-surreal",
    name: "Wildcard / Surreal",
    description: "dreamlike, absurd, \"what if\" scenarios",
    prompt: "If your dreams wrote tomorrow's headlines, what would they say?",
    image: "/wildcard-surreal.jpg"
  },
  {
    id: "learning-growth",
    name: "Learning / Growth",
    description: "skills, education, curiosity, personal development",
    prompt: "What new insight or fact surprised you today?",
    image: "/learning-growth.jpg"
  },
  {
    id: "community-society",
    name: "Community / Society",
    description: "current events, social issues, cultural identity",
    prompt: "Where did you feel most connected to others recently?",
    image: "/community-society.jpg"
  },
  {
    id: "gratitude-joy",
    name: "Gratitude / Joy",
    description: "appreciation, positivity, moments of happiness",
    prompt: "What small moment today filled you with gratitude?",
    image: "/gratitude-joy.jpg"
  },
  {
    id: "future-aspirations",
    name: "Future / Aspirations",
    description: "goals, dreams, what's ahead",
    prompt: "What's one hope you carry for your future self?",
    image: "/future-aspirations.jpg"
  }
];
