export interface LLMModel {
  id: string;
  name: string;
  contextLimit: number; // in tokens
  category: "openai" | "anthropic" | "google" | "other";
  icon: string;
}

export const LLM_CATEGORIES = {
  openai: { name: "OpenAI", color: "#10a37f" },
  anthropic: { name: "Anthropic", color: "#d97706" },
  google: { name: "Google", color: "#4285f4" },
  other: { name: "Other", color: "#6b7280" },
};

export const LLM_MODELS: LLMModel[] = [
  {
    id: "gpt-5",
    name: "GPT-5.1",
    contextLimit: 400000,
    category: "openai",
    icon: "",
  },
  {
    id: "chatgpt-plus-business-non-reasoning",
    name: "ChatGPT Plus/Business (non-reasoning)",
    contextLimit: 32000,
    category: "openai",
    icon: "",
  },
  {
    id: "chatgpt-pro-enterprise-non-reasoning",
    name: "ChatGPT Pro/Enterprise (non-reasoning)",
    contextLimit: 128000,
    category: "openai",
    icon: "",
  },
  {
    id: "chatgpt-reasoning",
    name: "ChatGPT Free/Plus/Pro/Business/Enterprise (reasoning)",
    contextLimit: 196000,
    category: "openai",
    icon: "",
  },
  {
    id: "claude-4-5-opus",
    name: "Claude 4.5 Opus",
    contextLimit: 200000,
    category: "anthropic",
    icon: "",
  },
  {
    id: "claude-4-5-sonnet",
    name: "Claude 4.5 Sonnet",
    contextLimit: 200000,
    category: "anthropic",
    icon: "",
  },
  {
    id: "gemini-3-pro",
    name: "Gemini 3 Pro",
    contextLimit: 1000000,
    category: "google",
    icon: "",
  },
];

export const getModelById = (id: string): LLMModel | undefined => {
  return LLM_MODELS.find((model) => model.id === id);
};

export const getModelsByCategory = (category: string): LLMModel[] => {
  return LLM_MODELS.filter((model) => model.category === category);
};
