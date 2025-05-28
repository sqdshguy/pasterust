export interface LLMModel {
  id: string;
  name: string;
  contextLimit: number; // in tokens
  category: 'openai' | 'anthropic' | 'google' | 'other';
  icon: string;
}

export const LLM_CATEGORIES = {
  openai: { name: 'OpenAI', color: '#10a37f' },
  anthropic: { name: 'Anthropic', color: '#d97706' },
  google: { name: 'Google', color: '#4285f4' },
  other: { name: 'Other', color: '#6b7280' }
};

export const LLM_MODELS: LLMModel[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    contextLimit: 128000,
    category: 'openai',
    icon: '🤖'
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextLimit: 128000,
    category: 'openai',
    icon: '🚀'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextLimit: 128000,
    category: 'openai',
    icon: '⚡'
  },
  {
    id: 'claude-3-haiku',
    name: 'Claude-3 Haiku',
    contextLimit: 200000,
    category: 'anthropic',
    icon: '🌸'
  },
  {
    id: 'claude-3-sonnet',
    name: 'Claude-3 Sonnet',
    contextLimit: 200000,
    category: 'anthropic',
    icon: '🎭'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude-3 Opus',
    contextLimit: 200000,
    category: 'anthropic',
    icon: '🎨'
  },
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    contextLimit: 1000000,
    category: 'google',
    icon: '💎'
  },
  {
    id: 'gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    contextLimit: 2000000,
    category: 'google',
    icon: '💠'
  }
];

export const getModelById = (id: string): LLMModel | undefined => {
  return LLM_MODELS.find(model => model.id === id);
};

export const getModelsByCategory = (category: string): LLMModel[] => {
  return LLM_MODELS.filter(model => model.category === category);
};