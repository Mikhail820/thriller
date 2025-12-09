
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  BookOpen, 
  FileText, 
  Skull, 
  ShieldAlert, 
  Wand2, 
  Image as ImageIcon, 
  Tag, 
  Save,
  Play,
  Copy,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Globe,
  Zap,
  PauseCircle,
  Users,
  Map,
  Dna,
  Sparkles,
  HelpCircle,
  Upload,
  Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ProjectState, StepType, Chapter } from './types';
import { generateText, generateStream, parseOutline, generateStyleSuggestion, generateStoryElement } from './services/geminiService';

// --- Localization ---

type Language = 'en' | 'ru';

const TRANSLATIONS = {
  en: {
    appTitle: "THRILLER",
    appSubtitle: "FORGE",
    processing: "Processing...",
    transmitting: "TRANSMITTING...",
    autopilot: "AUTOPILOT",
    autopilotStop: "STOP",
    save: "Export Project",
    import: "Import Project",
    help: "Field Manual",
    menu: {
      setup: "0. Setup",
      oneLiner: "1. One-Liner",
      skeleton: "2. Skeleton",
      characters: "3. Characters",
      world: "4. World & Arsenal",
      dna: "5. Story DNA",
      outline: "6. Outline",
      execution: "7. Execution",
      killHouse: "8. Kill House",
      intel: "9. Intel Check",
      polish: "10. Final Polish",
      cover: "11. Cover Ops",
      promo: "12. Propaganda",
      manual: "Field Manual"
    },
    setup: {
      title: "Mission Parameters",
      sub: "Define the core operational constraints.",
      autoStyle: "Auto-Detect Style",
      labels: {
        codename: "Codename (Title)",
        asset: "Asset (Protagonist)",
        threat: "Threat (Antagonist)",
        ao: "AO (Setting)",
        protocol: "Protocol (Style)",
        tone: "Tone / Rating"
      }
    },
    oneLiner: {
      title: "The Hook",
      sub: "Single sentence. High impact. No mercy.",
      btn: "Auto-Generate Hook",
      placeholder: "Output will appear here..."
    },
    skeleton: {
      title: "Tactical Skeleton",
      sub: "20-30 point breakdown of the operation.",
      btn: "Auto-Construct Skeleton",
      placeholder: "Skeleton structure..."
    },
    characters: {
      title: "Character Bible",
      sub: "Profiles, psychology, weaknesses.",
      btn: "Generate Personnel Files",
      placeholder: "Dossiers..."
    },
    world: {
      title: "World & Arsenal",
      sub: "World rules, tech, and inventory bible.",
      btn: "Generate Intel Package",
      placeholder: "World data..."
    },
    dna: {
      title: "Story DNA",
      sub: "Dialogue tone, violence doctrine, tension curve.",
      btn: "Sequence DNA",
      placeholder: "Stylistic analysis..."
    },
    outline: {
      title: "Mission Phase Line",
      sub: "Detailed 15-chapter breakdown.",
      btn: "Auto-Generate Phases",
      placeholder: "Raw outline data...",
      parsedTitle: "Parsed Chapters",
      noChapters: "No chapters parsed yet."
    },
    execution: {
      title: "EXECUTION PHASE",
      briefing: "Briefing",
      noSummary: "No summary available.",
      placeholder: "Chapter content will generate here...",
      btn: "Execute Chapter",
      noChaptersWarning: "NO MISSION PLAN. GENERATE OUTLINE FIRST."
    },
    killHouse: {
      title: "Kill House",
      sub: "Identify and eliminate weaknesses.",
      btn: "Run Diagnostics",
      select: "Analyze Ch",
      waiting: "AWAITING TARGET DATA",
      noChaptersWarning: "NO TARGETS. GENERATE CHAPTERS FIRST."
    },
    intel: {
      title: "Intel Verification",
      sub: "Global consistency check.",
      btn: "Verify Intel",
      placeholder: "Discrepancies will appear here..."
    },
    polish: {
      title: "Final Polish",
      sub: "Style injection. Remove water.",
      btn: "Refine Style",
      select: "Polish Ch",
      original: "ORIGINAL",
      output: "POLISHED OUTPUT",
      noChaptersWarning: "NO CONTENT. GENERATE CHAPTERS FIRST."
    },
    cover: {
      title: "Visual Recon",
      sub: "Cover art conceptualization.",
      btn: "Generate Prompt",
      label: "MidJourney / Flux Prompt"
    },
    promo: {
      title: "Propaganda",
      sub: "Blurb and Keywords.",
      btn: "Generate Metadata",
      lblBlurb: "Blurb",
      lblKeywords: "Keywords"
    },
    manual: {
      title: "Field Manual",
      sub: "Operational guidelines for ThrillerForge.",
      intro: "ThrillerForge is a military-grade creative suite designed to force-multiply your writing output. Follow the protocol:",
      steps: [
        { title: "Setup", desc: "Define the core conflict. Use the Magic Wands to auto-generate elements if you are stuck." },
        { title: "Deep Forge", desc: "Do not skip Steps 3-5. This is where the AI builds the context (Characters, World, DNA) that ensures the story holds together." },
        { title: "Execution", desc: "The AI writes better when it has a Plan (Outline). It writes 'Tactical Drafts' first, then expands." },
        { title: "Kill House", desc: "Use this to find plot holes. The AI acts as a hostile editor." },
        { title: "Autopilot", desc: "Use the button in the top right to automatically advance through the planning stages." }
      ]
    }
  },
  ru: {
    appTitle: "ТРИЛЛЕР",
    appSubtitle: "КУЗНЯ",
    processing: "Обработка...",
    transmitting: "ПЕРЕДАЧА...",
    autopilot: "АВТОПИЛОТ",
    autopilotStop: "СТОП",
    save: "Сохранить проект",
    import: "Загрузить проект",
    help: "Справка",
    menu: {
      setup: "0. Настройка",
      oneLiner: "1. Логлайн",
      skeleton: "2. Скелет",
      characters: "3. Персонажи",
      world: "4. Мир и Арсенал",
      dna: "5. ДНК Истории",
      outline: "6. План",
      execution: "7. Написание",
      killHouse: "8. Редактура",
      intel: "9. Проверка",
      polish: "10. Полировка",
      cover: "11. Обложка",
      promo: "12. Промо",
      manual: "Справка"
    },
    setup: {
      title: "Параметры миссии",
      sub: "Ключевые ограничения операции.",
      autoStyle: "Подбор стиля",
      labels: {
        codename: "Код (Название)",
        asset: "Агент (Протагонист)",
        threat: "Угроза (Антагонист)",
        ao: "Локация (Сеттинг)",
        protocol: "Протокол (Стиль)",
        tone: "Тон / Рейтинг"
      }
    },
    oneLiner: {
      title: "Крючок",
      sub: "Одно предложение. Максимальный удар.",
      btn: "Авто-генерация",
      placeholder: "Результат появится здесь..."
    },
    skeleton: {
      title: "Тактический скелет",
      sub: "20-30 ключевых точек операции.",
      btn: "Авто-структура",
      placeholder: "Структура сюжета..."
    },
    characters: {
      title: "Библия персонажей",
      sub: "Досье, психология, слабости.",
      btn: "Создать досье",
      placeholder: "Данные персонала..."
    },
    world: {
      title: "Мир и Арсенал",
      sub: "Правила мира, технологии, инвентарь.",
      btn: "Создать пакет данных",
      placeholder: "Сводка по миру..."
    },
    dna: {
      title: "ДНК Истории",
      sub: "Тон диалогов, доктрина жести, кривая напряжения.",
      btn: "Синтез ДНК",
      placeholder: "Стилистический анализ..."
    },
    outline: {
      title: "Фазы миссии",
      sub: "Детальный план на 15 глав.",
      btn: "Авто-план",
      placeholder: "Сырые данные плана...",
      parsedTitle: "Главы",
      noChapters: "Главы еще не разобраны."
    },
    execution: {
      title: "ФАЗА ИСПОЛНЕНИЯ",
      briefing: "Брифинг",
      noSummary: "Нет сводки.",
      placeholder: "Текст главы генерируется здесь...",
      btn: "Выполнить",
      noChaptersWarning: "НЕТ ПЛАНА МИССИИ. СНАЧАЛА СОЗДАЙТЕ 'ПЛАН'."
    },
    killHouse: {
      title: "Дом смерти",
      sub: "Поиск и устранение слабостей.",
      btn: "Запуск диагностики",
      select: "Анализ гл.",
      waiting: "ОЖИДАНИЕ ДАННЫХ ЦЕЛИ",
      noChaptersWarning: "НЕТ ЦЕЛЕЙ. СНАЧАЛА НАПИШИТЕ ГЛАВЫ."
    },
    intel: {
      title: "Проверка разведданных",
      sub: "Глобальная проверка логики.",
      btn: "Сверить данные",
      placeholder: "Противоречия появятся здесь..."
    },
    polish: {
      title: "Финальная полировка",
      sub: "Инъекция стиля. Удаление воды.",
      btn: "Улучшить стиль",
      select: "Полировка гл.",
      original: "ОРИГИНАЛ",
      output: "РЕЗУЛЬТАТ",
      noChaptersWarning: "НЕТ КОНТЕНТА. СНАЧАЛА НАПИШИТЕ ГЛАВЫ."
    },
    cover: {
      title: "Визуальная разведка",
      sub: "Концепция обложки.",
      btn: "Создать промпт",
      label: "Промпт для MidJourney / Flux"
    },
    promo: {
      title: "Пропаганда",
      sub: "Аннотация и теги.",
      btn: "Создать метаданные",
      lblBlurb: "Аннотация",
      lblKeywords: "Ключевые слова"
    },
    manual: {
      title: "Полевой устав",
      sub: "Инструкция по эксплуатации системы.",
      intro: "ТриллерКузня — это тактический инструмент для форсированного написания книг. Следуйте протоколу:",
      steps: [
        { title: "Настройка", desc: "Задайте конфликт. Используйте 'Волшебные палочки' для генерации идей, если застряли." },
        { title: "Глубокая ковка (Deep Forge)", desc: "Не пропускайте шаги 3-5. Здесь ИИ создает контекст (Персонажи, Мир, ДНК), который удерживает историю от распада." },
        { title: "Исполнение", desc: "ИИ пишет лучше, когда есть План (Outline). Он сначала пишет 'Тактический черновик', затем текст." },
        { title: "Дом смерти", desc: "Используйте для поиска сюжетных дыр. ИИ работает как враждебный редактор." },
        { title: "Автопилот", desc: "Кнопка сверху справа для автоматического прохода по всем стадиям планирования." }
      ]
    }
  }
};

// --- Constants ---

const INITIAL_STATE_EN: ProjectState = {
  title: "Untitled Project",
  authorStyle: "Dan Brown mixed with John Wick",
  tone: "Dark, gritty, 18+, blood and tactical realism",
  protagonist: "Ex-PMC Operative",
  antagonist: "Corrupt Intelligence Director",
  setting: "Cyberpunk Moscow, 2035",
  oneLiner: "", skeleton: "", characters: "", world: "", dna: "", outlineRaw: "", chapters: [], consistencyReport: "", polishedManuscript: "", coverPrompt: "", blurb: "", keywords: ""
};

const INITIAL_STATE_RU: ProjectState = {
  title: "Проект 'Тишина'",
  authorStyle: "Смесь Дэна Брауна и Джона Уика",
  tone: "Мрачный, жесткий, 18+, кровь и тактический реализм",
  protagonist: "Бывший оперативник ЧВК",
  antagonist: "Коррумпированный директор разведки",
  setting: "Киберпанк Москва, 2035",
  oneLiner: "", skeleton: "", characters: "", world: "", dna: "", outlineRaw: "", chapters: [], consistencyReport: "", polishedManuscript: "", coverPrompt: "", blurb: "", keywords: ""
};

const SYSTEM_PERSONA_DEFAULT = "You are an expert thriller novelist. Your style is gritty, fast-paced, and cinematic.";
const SYSTEM_PERSONA_EDITOR = "You are a ruthless special-ops editor. You hate passive voice, plot holes, and factual inaccuracies. You are brutal but constructive.";

// --- Components ---

const SidebarItem = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string 
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
      active 
        ? 'bg-slate-800 border-amber-500 text-amber-500' 
        : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    <Icon size={18} className="shrink-0" />
    <span className="truncate">{label}</span>
  </button>
);

const SectionHeader = ({ title, sub }: { title: string; sub: string }) => (
  <div className="mb-4 md:mb-6 border-b border-slate-800 pb-4">
    <h2 className="text-xl md:text-2xl font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2 flex-wrap">
      <span className="text-amber-500">///</span> {title}
    </h2>
    <p className="text-slate-500 text-xs md:text-sm mt-1 font-mono break-words">{sub}</p>
  </div>
);

interface ActionButtonProps {
  onClick: () => void | Promise<void>;
  loading: boolean;
  children?: React.ReactNode;
  icon?: React.ElementType;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent';
  textProcessing?: string;
  className?: string;
}

const ActionButton = ({ 
  onClick, 
  loading, 
  children, 
  icon: Icon,
  variant = 'primary',
  textProcessing = "...",
  className = ""
}: ActionButtonProps) => {
  const baseClasses = "flex items-center justify-center gap-2 px-6 py-3 md:py-2 rounded-sm font-mono text-sm uppercase tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation whitespace-nowrap shadow-md";
  const variants = {
    primary: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600",
    danger: "bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800",
    accent: "bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={loading}
      className={`${baseClasses} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="animate-pulse">{textProcessing}</span>
      ) : (
        <>
          {Icon && <Icon size={16} />}
          {children}
        </>
      )}
    </button>
  );
};

// New smart input component
const InputWithGenerator = ({ 
  label, 
  value, 
  onChange, 
  onGenerate, 
  loading 
}: { 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  onGenerate: () => void; 
  loading: boolean;
}) => (
  <div className="relative">
    <label className="block text-slate-400 text-xs uppercase font-mono mb-1">{label}</label>
    <div className="flex group">
      <input 
        type="text" 
        value={value}
        onChange={onChange}
        className="flex-1 bg-slate-900 border border-slate-700 border-r-0 rounded-l p-3 text-slate-100 focus:border-amber-500 focus:outline-none text-base transition-colors"
      />
      <button 
        onClick={onGenerate}
        disabled={loading}
        title="Auto-Generate this field"
        className="bg-slate-800 border border-slate-700 border-l-0 rounded-r px-3 text-amber-600 hover:text-amber-400 hover:bg-slate-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <span className="animate-spin block">⟳</span> : <Sparkles size={16} />}
      </button>
    </div>
  </div>
);

// --- Main App ---

export default function App() {
  const [language, setLanguage] = useState<Language>('ru');
  const t = TRANSLATIONS[language];

  const [activeStep, setActiveStep] = useState<StepType>(StepType.SETUP);
  const [project, setProject] = useState<ProjectState>(INITIAL_STATE_RU);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autopilotMode, setAutopilotMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Chapter management
  const [activeChapterIndex, setActiveChapterIndex] = useState<number>(0);

  // Switch initial state when language changes if the project is untouched
  useEffect(() => {
    // Simple check: if title matches one of the defaults, switch it
    if (project.title === INITIAL_STATE_EN.title || project.title === INITIAL_STATE_RU.title) {
      setProject(language === 'ru' ? INITIAL_STATE_RU : INITIAL_STATE_EN);
    }
  }, [language]);

  // --- Autopilot Logic ---

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    const runAutopilotStep = async () => {
      if (!autopilotMode || loading) return;

      const next = (step: StepType) => {
        setActiveStep(step);
      };

      if (activeStep === StepType.SETUP) { next(StepType.ONE_LINER); return; }

      if (activeStep === StepType.ONE_LINER) {
        !project.oneLiner ? await handleGenerateOneLiner() : next(StepType.SKELETON);
        return;
      }

      if (activeStep === StepType.SKELETON) {
        !project.skeleton ? await handleGenerateSkeleton() : next(StepType.CHARACTERS);
        return;
      }

      if (activeStep === StepType.CHARACTERS) {
        !project.characters ? await handleGenerateCharacters() : next(StepType.WORLD);
        return;
      }

      if (activeStep === StepType.WORLD) {
        !project.world ? await handleGenerateWorld() : next(StepType.DNA);
        return;
      }

      if (activeStep === StepType.DNA) {
        !project.dna ? await handleGenerateDNA() : next(StepType.OUTLINE);
        return;
      }

      if (activeStep === StepType.OUTLINE) {
        if (!project.outlineRaw) {
          await handleGenerateOutline();
        } else {
          // Pause here for user to review Outline
          setAutopilotMode(false);
          next(StepType.CHAPTER_GEN);
        }
        return;
      }

      // Safety stop for execution to prevent burning tokens uncontrollably
      if (activeStep === StepType.CHAPTER_GEN) {
         setAutopilotMode(false);
      }
    };

    if (autopilotMode) {
      timeout = setTimeout(runAutopilotStep, 1000); // Small delay to visualize transitions
    }

    return () => clearTimeout(timeout);
  }, [autopilotMode, activeStep, project, loading]);

  const toggleAutopilot = () => {
    setAutopilotMode(!autopilotMode);
  };

  // --- IO Logic ---

  const handleExportProject = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `thrillerforge-${project.title.replace(/[\s\W]+/g, '-').toLowerCase()}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.title !== undefined) {
          setProject(json);
          // Reset
          if (fileInputRef.current) fileInputRef.current.value = "";
          alert("Project loaded successfully.");
        } else {
          alert("Invalid project file.");
        }
      } catch (err) {
        console.error("Import failed", err);
        alert("Failed to import project.");
      }
    };
    reader.readAsText(file);
  };

  // --- Helper State Updates ---

  const updateProject = (key: keyof ProjectState, value: any) => {
    setProject(prev => ({ ...prev, [key]: value }));
  };

  const updateChapter = (index: number, key: keyof Chapter, value: string) => {
    setProject(prev => {
      const newChapters = [...prev.chapters];
      if (!newChapters[index]) return prev;
      newChapters[index] = { ...newChapters[index], [key]: value };
      return { ...prev, chapters: newChapters };
    });
  };

  const getLangInstruction = () => {
    return language === 'ru' 
      ? "IMPORTANT: Output strictly in Russian language." 
      : "Output in English.";
  };

  // --- Logic Generators ---

  const handleGenerateSetupField = async (field: 'title' | 'protagonist' | 'antagonist' | 'setting' | 'tone') => {
    setLoading(true);
    // Context mapping
    const context = {
      title: project.title,
      protagonist: project.protagonist,
      antagonist: project.antagonist,
      setting: project.setting,
      tone: project.tone
    };

    const text = await generateStoryElement(field, context, getLangInstruction());
    // Sanitize typical AI quotes/prefixes if any (simple cleanup)
    const cleanText = text.replace(/^"|"$/g, '').replace(/^Title: /i, '').trim();
    updateProject(field, cleanText);
    setLoading(false);
  };

  const handleAutoSuggestStyle = async () => {
    setLoading(true);
    const suggestion = await generateStyleSuggestion(
      project.protagonist,
      project.antagonist,
      project.setting,
      project.tone,
      getLangInstruction()
    );
    updateProject('authorStyle', suggestion);
    setLoading(false);
  };

  const handleGenerateOneLiner = async () => {
    setLoading(true);
    const prompt = `Based on:
    Protagonist: ${project.protagonist}
    Antagonist: ${project.antagonist}
    Setting: ${project.setting}
    Style: ${project.authorStyle}
    
    Write a single, high-concept logline (one sentence) for a thriller novel.
    ${getLangInstruction()}`;
    
    const text = await generateText(prompt, 'gemini-2.5-flash', SYSTEM_PERSONA_DEFAULT);
    updateProject('oneLiner', text);
    setLoading(false);
  };

  const handleGenerateSkeleton = async () => {
    setLoading(true);
    const prompt = `Create a full novel skeleton (20-30 points) for:
    Title: ${project.title}
    Logline: ${project.oneLiner}
    
    Include:
    - Hero + 3 key traits
    - Antagonist + motive
    - The Stakes
    - 20 Key Scenes (one line each)
    - 3 Major Twists
    - Ending (Open/Closed)
    
    ${getLangInstruction()}`;

    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_DEFAULT);
    updateProject('skeleton', text);
    setLoading(false);
  };

  const handleGenerateCharacters = async () => {
    setLoading(true);
    const prompt = `Create a Character Bible (BIBLE OF CHARACTERS).
    Context:
    ${project.oneLiner}
    ${project.skeleton}
    
    For each major character (Protagonist, Antagonist, 2-3 supporting):
    [Name]
    - Age
    - Appearance
    - Background
    - Character (3-5 traits)
    - Skills
    - Motivation
    - Weakness
    - Emotional Arc
    
    ${getLangInstruction()}`;
    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_DEFAULT);
    updateProject('characters', text);
    setLoading(false);
  };

  const handleGenerateWorld = async () => {
    setLoading(true);
    const prompt = `Create World Rules and Inventory Bible.
    Context: ${project.setting}
    
    1. WORLD RULES:
    - Technology
    - Politics
    - Criminal Underworld
    - Geography
    - Anomalies (if any)
    - Taboos/Limitations
    
    2. INVENTORY BIBLE (Prop List):
    List key items (Weapons, Gadgets, Artifacts). For each:
    - Description
    - Specs
    - Owner
    - Limitations
    
    ${getLangInstruction()}`;
    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_DEFAULT);
    updateProject('world', text);
    setLoading(false);
  };

  const handleGenerateDNA = async () => {
    setLoading(true);
    const prompt = `Define the Story DNA.
    
    1. DIALOGUE TONE:
    - Hero's speech style
    - Antagonist's speech style
    - Sarcasm/Profanity level
    
    2. VIOLENCE DOCTRINE (S0-S3):
    - Level (e.g., S2 - Heavy Tactical)
    - What is allowed vs forbidden
    
    3. TENSION CURVE:
    - Chapters 1-3
    - Chapters 4-7
    - Chapters 8-12
    - Climax
    
    ${getLangInstruction()}`;
    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_DEFAULT);
    updateProject('dna', text);
    setLoading(false);
  };

  const handleGenerateOutline = async () => {
    setLoading(true);
    const prompt = `Write a detailed 15-chapter outline.
    Reference:
    ${project.skeleton}
    ${project.dna}
    
    Format required:
    Chapter X: [Title]
    [3-4 lines of detailed summary describing the action, conflict, and outcome]
    
    ${getLangInstruction()}`;

    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_DEFAULT);
    updateProject('outlineRaw', text);
    
    const parsedChapters = parseOutline(text).map((c, i) => ({
      id: i + 1,
      title: c.title,
      summary: c.summary,
      content: "",
      critique: ""
    }));
    updateProject('chapters', parsedChapters);
    
    setLoading(false);
  };

  const handleWriteChapter = async (index: number) => {
    const chapter = project.chapters[index];
    if (!chapter) {
      console.error("No chapter found at index", index);
      return;
    }

    setLoading(true);
    updateChapter(index, 'content', "");

    const prevContext = index > 0 
      ? `Previous chapter ended with: ...${project.chapters[index - 1].content.slice(-1000)}` 
      : "Start of novel.";

    // Massive Context Injection
    const prompt = `
    ROLE: ${project.authorStyle}
    TASK: Write Chapter ${chapter.id}: ${chapter.title}.
    
    SUMMARY: ${chapter.summary}
    
    CONTEXT DATA:
    --- CHARACTERS ---
    ${project.characters}
    --- WORLD RULES ---
    ${project.world}
    --- TONE & DNA ---
    ${project.dna}
    --- PREVIOUS CONTEXT ---
    ${prevContext}
    
    INSTRUCTIONS:
    1. First, output a "TACTICAL DRAFT" (5-7 bullet points of the scene beat-by-beat).
    2. Then, write the full chapter content.
    3. Use Russian language (if requested).
    4. Adhere strictly to the Violence Doctrine and Dialogue Tone.
    5. NO FILLER. ACTION, DIALOGUE, FACTS.
    
    ${getLangInstruction()}`;

    let accumulated = "";

    await generateStream(
      prompt, 
      (chunk) => {
        accumulated += chunk;
        updateChapter(index, 'content', accumulated);
      }, 
      'gemini-3-pro-preview', 
      SYSTEM_PERSONA_DEFAULT
    );
    setLoading(false);
  };

  const handleCritiqueChapter = async (index: number) => {
    const chapter = project.chapters[index];
    if (!chapter) return;

    setLoading(true);
    
    const prompt = `You are a special-forces editor. Analyze the following chapter text.
    Find logical errors, factual errors (weapons, tactics, geography), plot holes, and continuity issues.
    
    Text:
    ${chapter.content}
    
    Output ONLY a Markdown table with these columns:
    | # | Quote | Type | Why it's wrong | Fix |
    
    ${getLangInstruction()}`;

    const text = await generateText(prompt, 'gemini-2.5-flash', SYSTEM_PERSONA_EDITOR);
    updateChapter(index, 'critique', text);
    setLoading(false);
  };

  const handleConsistencyCheck = async () => {
    setLoading(true);
    const fullContext = project.chapters.map(c => `Ch${c.id}: ${c.summary}`).join('\n');
    
    const prompt = `Check internal consistency.
    Input:
    ${fullContext}
    ${project.skeleton}
    ${project.world}
    
    List every contradiction found (Names, Dates, Rules, Inventory).
    ${getLangInstruction()}`;

    const text = await generateText(prompt, 'gemini-3-pro-preview', SYSTEM_PERSONA_EDITOR);
    updateProject('consistencyReport', text);
    setLoading(false);
  };

  const handlePolish = async () => {
    const chapter = project.chapters[activeChapterIndex];
    if (!chapter || !chapter.content) {
        alert("Select a chapter with content to polish.");
        return;
    }

    setLoading(true);
    const prompt = `Rewrite in style: ${project.authorStyle}.
    - Cut 15% water.
    - Enhance grit and tone.
    
    Text:
    ${chapter.content}
    
    ${getLangInstruction()}`;

    updateProject('polishedManuscript', "");
    let accumulated = "";

    await generateStream(
      prompt,
      (chunk) => {
         accumulated += chunk;
         updateProject('polishedManuscript', accumulated);
      },
      'gemini-3-pro-preview', 
      SYSTEM_PERSONA_DEFAULT
    );
    setLoading(false);
  };

  const handleGenerateCoverPrompt = async () => {
    setLoading(true);
    const prompt = `Create a high-end AI art prompt (Flux/MidJourney).
    Book: ${project.title}
    Vibe: ${project.tone}
    Setting: ${project.setting}
    
    Output format: "Dark cinematic cover, [Subject], [Action], [Lighting], [Color Grading] --ar 3:2 --v 6"
    Output strictly in ENGLISH.`;

    const text = await generateText(prompt, 'gemini-2.5-flash', SYSTEM_PERSONA_DEFAULT);
    updateProject('coverPrompt', text);
    setLoading(false);
  };

  const handleGenerateMarketing = async () => {
    setLoading(true);
    
    const p1 = `Write a 600-character killer blurb for LitRes/Amazon.
    Context: ${project.oneLiner}
    ${getLangInstruction()}`;
    
    const p2 = `Generate 30 high-ranking SEO keywords for Thriller/Action category 2025. ${getLangInstruction()}`;

    const [blurb, keywords] = await Promise.all([
      generateText(p1, 'gemini-2.5-flash'),
      generateText(p2, 'gemini-2.5-flash')
    ]);

    updateProject('blurb', blurb);
    updateProject('keywords', keywords);
    setLoading(false);
  };


  // --- Render Steps ---

  const renderStepContent = () => {
    switch (activeStep) {
      case StepType.MANUAL:
        return (
          <div className="space-y-6 max-w-4xl mx-auto pb-20">
             <SectionHeader title={t.manual.title} sub={t.manual.sub} />
             <div className="bg-slate-900 border border-slate-700 p-6 rounded-lg space-y-6">
                <p className="text-amber-500 font-mono text-sm uppercase tracking-wide border-l-2 border-amber-500 pl-4">
                  {t.manual.intro}
                </p>
                <div className="space-y-4">
                  {t.manual.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="text-slate-500 font-bold font-mono text-xl">{String(idx + 1).padStart(2, '0')}</div>
                      <div>
                        <h3 className="text-slate-200 font-bold uppercase">{step.title}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-500 font-mono">
                   THRILLER FORGE OPERATING SYSTEM v2.0
                </div>
             </div>
          </div>
        );

      case StepType.SETUP:
        return (
          <div className="space-y-6 max-w-4xl mx-auto pb-20">
            <SectionHeader title={t.setup.title} sub={t.setup.sub} />
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <InputWithGenerator 
                    label={t.setup.labels.codename}
                    value={project.title}
                    onChange={(e) => updateProject('title', e.target.value)}
                    onGenerate={() => handleGenerateSetupField('title')}
                    loading={loading}
                  />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <InputWithGenerator 
                      label={t.setup.labels.asset}
                      value={project.protagonist}
                      onChange={(e) => updateProject('protagonist', e.target.value)}
                      onGenerate={() => handleGenerateSetupField('protagonist')}
                      loading={loading}
                    />
                 </div>
                 <div>
                    <InputWithGenerator 
                      label={t.setup.labels.threat}
                      value={project.antagonist}
                      onChange={(e) => updateProject('antagonist', e.target.value)}
                      onGenerate={() => handleGenerateSetupField('antagonist')}
                      loading={loading}
                    />
                 </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                   <InputWithGenerator 
                      label={t.setup.labels.ao}
                      value={project.setting}
                      onChange={(e) => updateProject('setting', e.target.value)}
                      onGenerate={() => handleGenerateSetupField('setting')}
                      loading={loading}
                    />
                </div>
                <div>
                    <InputWithGenerator 
                      label={t.setup.labels.tone}
                      value={project.tone}
                      onChange={(e) => updateProject('tone', e.target.value)}
                      onGenerate={() => handleGenerateSetupField('tone')}
                      loading={loading}
                    />
                </div>
               </div>
               <div>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-2">
                    <label className="block text-slate-400 text-xs uppercase font-mono">{t.setup.labels.protocol}</label>
                    <button 
                      onClick={handleAutoSuggestStyle}
                      disabled={loading}
                      className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 uppercase font-mono border border-amber-900/50 px-2 py-1 rounded hover:bg-amber-900/20"
                    >
                      <Zap size={12} /> {t.setup.autoStyle}
                    </button>
                  </div>
                  <textarea 
                    value={project.authorStyle}
                    onChange={(e) => updateProject('authorStyle', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 p-3 rounded text-slate-100 focus:border-amber-500 focus:outline-none h-24 text-base"
                  />
               </div>
            </div>
          </div>
        );

      case StepType.ONE_LINER:
        return (
          <div className="space-y-4 md:space-y-6 flex flex-col h-full">
            <SectionHeader title={t.oneLiner.title} sub={t.oneLiner.sub} />
            <div><ActionButton onClick={handleGenerateOneLiner} loading={loading} icon={Wand2} textProcessing={t.processing}>{t.oneLiner.btn}</ActionButton></div>
            <textarea 
              value={project.oneLiner}
              onChange={(e) => updateProject('oneLiner', e.target.value)}
              className="flex-1 w-full bg-slate-800/50 border border-slate-700 p-4 md:p-6 rounded text-lg md:text-xl text-amber-500 font-serif leading-relaxed focus:outline-none resize-none"
              placeholder={t.oneLiner.placeholder}
            />
          </div>
        );

      case StepType.SKELETON:
        return (
          <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <SectionHeader title={t.skeleton.title} sub={t.skeleton.sub} />
            <div><ActionButton onClick={handleGenerateSkeleton} loading={loading} icon={Wand2} textProcessing={t.processing}>{t.skeleton.btn}</ActionButton></div>
            <textarea 
              value={project.skeleton}
              onChange={(e) => updateProject('skeleton', e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder={t.skeleton.placeholder}
            />
          </div>
        );

      case StepType.CHARACTERS:
        return (
          <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <SectionHeader title={t.characters.title} sub={t.characters.sub} />
            <div><ActionButton onClick={handleGenerateCharacters} loading={loading} icon={Users} textProcessing={t.processing}>{t.characters.btn}</ActionButton></div>
            <textarea 
              value={project.characters}
              onChange={(e) => updateProject('characters', e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder={t.characters.placeholder}
            />
          </div>
        );

      case StepType.WORLD:
        return (
          <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <SectionHeader title={t.world.title} sub={t.world.sub} />
            <div><ActionButton onClick={handleGenerateWorld} loading={loading} icon={Map} textProcessing={t.processing}>{t.world.btn}</ActionButton></div>
            <textarea 
              value={project.world}
              onChange={(e) => updateProject('world', e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder={t.world.placeholder}
            />
          </div>
        );

      case StepType.DNA:
        return (
          <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <SectionHeader title={t.dna.title} sub={t.dna.sub} />
            <div><ActionButton onClick={handleGenerateDNA} loading={loading} icon={Dna} textProcessing={t.processing}>{t.dna.btn}</ActionButton></div>
            <textarea 
              value={project.dna}
              onChange={(e) => updateProject('dna', e.target.value)}
              className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder={t.dna.placeholder}
            />
          </div>
        );

      case StepType.OUTLINE:
        return (
          <div className="space-y-4 md:space-y-6 h-full flex flex-col">
            <SectionHeader title={t.outline.title} sub={t.outline.sub} />
            <div><ActionButton onClick={handleGenerateOutline} loading={loading} icon={Wand2} textProcessing={t.processing}>{t.outline.btn}</ActionButton></div>
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
               <textarea 
                value={project.outlineRaw}
                onChange={(e) => updateProject('outlineRaw', e.target.value)}
                className="w-full h-64 lg:h-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none"
                placeholder={t.outline.placeholder}
              />
              <div className="bg-slate-800/30 border border-slate-700 rounded p-4 overflow-y-auto">
                <h3 className="text-amber-500 font-mono text-xs uppercase mb-4">{t.outline.parsedTitle}</h3>
                <div className="space-y-3">
                  {project.chapters.length === 0 && <p className="text-slate-500 text-sm">{t.outline.noChapters}</p>}
                  {project.chapters.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-800 rounded border border-slate-700">
                      <div className="font-bold text-slate-200 text-sm">{c.id}. {c.title}</div>
                      <div className="text-xs text-slate-500 mt-1 line-clamp-2">{c.summary}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case StepType.CHAPTER_GEN:
        if (project.chapters.length === 0) {
           return (
             <div className="flex flex-col h-full items-center justify-center space-y-4 text-center p-6">
                <ShieldAlert size={48} className="text-slate-700" />
                <h3 className="text-slate-400 font-mono text-lg">{t.execution.noChaptersWarning}</h3>
                <ActionButton onClick={() => setActiveStep(StepType.OUTLINE)} loading={false} icon={FileText}>{t.menu.outline}</ActionButton>
             </div>
           );
        }
        return (
          <div className="flex flex-col h-full space-y-4">
             <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-4 gap-4 flex-wrap">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span className="text-amber-500">///</span> {t.execution.title}
                  </h2>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-2">
                  <select 
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-base md:text-sm rounded p-3 md:p-2 focus:outline-none w-full sm:w-auto"
                    value={activeChapterIndex}
                    onChange={(e) => setActiveChapterIndex(Number(e.target.value))}
                  >
                    {project.chapters.map((c, i) => (
                      <option key={c.id} value={i}>{c.id}: {c.title.substring(0, 30)}...</option>
                    ))}
                  </select>
                  <ActionButton onClick={() => handleWriteChapter(activeChapterIndex)} loading={loading} icon={Play} textProcessing={t.transmitting}>{t.execution.btn}</ActionButton>
                </div>
             </div>
             
             <div className="flex-1 flex flex-col md:flex-row gap-4 min-h-0 overflow-y-auto md:overflow-hidden">
                <div className="w-full md:w-1/4 bg-slate-900/50 p-4 rounded border border-slate-800 overflow-y-auto max-h-32 md:max-h-full shrink-0">
                  <h4 className="text-xs font-mono text-slate-500 uppercase mb-2">{t.execution.briefing}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{project.chapters[activeChapterIndex]?.summary || t.execution.noSummary}</p>
                </div>
                
                <div className="flex-1 relative min-h-[300px] md:h-full">
                  <textarea 
                    value={project.chapters[activeChapterIndex]?.content || ""}
                    onChange={(e) => updateChapter(activeChapterIndex, 'content', e.target.value)}
                    className="w-full h-full bg-slate-950 border border-slate-800 p-4 md:p-6 rounded text-slate-300 font-serif text-base md:text-lg leading-relaxed focus:outline-none resize-none selection:bg-amber-900/50"
                    placeholder={t.execution.placeholder}
                  />
                  {loading && <div className="absolute bottom-4 right-4 text-amber-500 text-xs font-mono animate-pulse">{t.transmitting}</div>}
                </div>
             </div>
          </div>
        );

      case StepType.ERROR_KILLER:
        if (project.chapters.length === 0) {
          return (
            <div className="flex flex-col h-full items-center justify-center space-y-4 text-center p-6">
               <ShieldAlert size={48} className="text-slate-700" />
               <h3 className="text-slate-400 font-mono text-lg">{t.killHouse.noChaptersWarning}</h3>
            </div>
          );
       }
        const activeCritique = project.chapters[activeChapterIndex]?.critique;
        return (
          <div className="flex flex-col h-full space-y-4">
            <SectionHeader title={t.killHouse.title} sub={t.killHouse.sub} />
            <div className="flex flex-col sm:flex-row gap-2">
               <select 
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-base md:text-sm rounded p-3 md:p-2 focus:outline-none w-full sm:w-auto"
                    value={activeChapterIndex}
                    onChange={(e) => setActiveChapterIndex(Number(e.target.value))}
                  >
                    {project.chapters.map((c, i) => (
                      <option key={c.id} value={i}>{t.killHouse.select} {c.id}</option>
                    ))}
              </select>
              <ActionButton onClick={() => handleCritiqueChapter(activeChapterIndex)} loading={loading} icon={ShieldAlert} variant="danger" textProcessing={t.processing}>{t.killHouse.btn}</ActionButton>
            </div>
            
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded p-6 overflow-y-auto prose prose-invert prose-sm max-w-none">
              {activeCritique ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeCritique}</ReactMarkdown>
              ) : (
                <div className="text-slate-600 font-mono text-center mt-20">{t.killHouse.waiting}</div>
              )}
            </div>
          </div>
        );

      case StepType.CONSISTENCY:
        return (
           <div className="flex flex-col h-full space-y-4">
            <SectionHeader title={t.intel.title} sub={t.intel.sub} />
            <div><ActionButton onClick={handleConsistencyCheck} loading={loading} icon={CheckCircle2} textProcessing={t.processing}>{t.intel.btn}</ActionButton></div>
            <textarea 
              value={project.consistencyReport}
              readOnly
              className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-red-200 font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder={t.intel.placeholder}
            />
          </div>
        );

      case StepType.POLISH:
         if (project.chapters.length === 0) {
          return (
            <div className="flex flex-col h-full items-center justify-center space-y-4 text-center p-6">
               <Wand2 size={48} className="text-slate-700" />
               <h3 className="text-slate-400 font-mono text-lg">{t.polish.noChaptersWarning}</h3>
            </div>
          );
         }
         return (
           <div className="flex flex-col h-full space-y-4">
            <SectionHeader title={t.polish.title} sub={t.polish.sub} />
            <div className="flex flex-col sm:flex-row gap-2">
               <select 
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-base md:text-sm rounded p-3 md:p-2 focus:outline-none w-full sm:w-auto"
                  value={activeChapterIndex}
                  onChange={(e) => setActiveChapterIndex(Number(e.target.value))}
                >
                  {project.chapters.map((c, i) => (
                    <option key={c.id} value={i}>{t.polish.select} {c.id}</option>
                  ))}
                </select>
                <ActionButton onClick={handlePolish} loading={loading} icon={Wand2} textProcessing={t.processing}>{t.polish.btn}</ActionButton>
            </div>
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
               <div className="flex flex-col h-48 md:h-full">
                  <span className="text-xs text-slate-500 mb-2 font-mono uppercase">{t.polish.original}</span>
                  <textarea 
                    value={project.chapters[activeChapterIndex]?.content || ""}
                    readOnly
                    className="flex-1 w-full bg-slate-900/50 border border-slate-800 p-4 rounded text-slate-500 font-serif text-sm resize-none focus:outline-none"
                  />
               </div>
               <div className="flex flex-col h-64 md:h-full">
                  <span className="text-xs text-amber-500 mb-2 font-mono uppercase">{t.polish.output}</span>
                  <textarea 
                    value={project.polishedManuscript}
                    onChange={(e) => updateProject('polishedManuscript', e.target.value)}
                    className="flex-1 w-full bg-slate-950 border border-amber-900/30 p-4 rounded text-slate-200 font-serif text-sm resize-none focus:border-amber-500 focus:outline-none"
                    placeholder="..."
                  />
               </div>
            </div>
          </div>
        );

      case StepType.COVER_ART:
        return (
          <div className="space-y-6">
            <SectionHeader title={t.cover.title} sub={t.cover.sub} />
            <ActionButton onClick={handleGenerateCoverPrompt} loading={loading} icon={ImageIcon} textProcessing={t.processing}>{t.cover.btn}</ActionButton>
            
            <div className="space-y-2">
              <label className="text-xs uppercase text-slate-500 font-mono">{t.cover.label}</label>
              <div className="relative group">
                <textarea 
                  value={project.coverPrompt}
                  readOnly
                  className="w-full h-32 bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm focus:outline-none"
                />
                <button 
                  onClick={() => navigator.clipboard.writeText(project.coverPrompt)}
                  className="absolute top-2 right-2 p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                  title="Copy"
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        );

      case StepType.BLURB:
        return (
          <div className="space-y-6 h-full flex flex-col">
            <SectionHeader title={t.promo.title} sub={t.promo.sub} />
            <div><ActionButton onClick={handleGenerateMarketing} loading={loading} icon={Tag} textProcessing={t.processing}>{t.promo.btn}</ActionButton></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
              <div className="flex flex-col">
                <label className="text-xs uppercase text-slate-500 font-mono mb-2">{t.promo.lblBlurb}</label>
                <textarea 
                  value={project.blurb}
                  onChange={(e) => updateProject('blurb', e.target.value)}
                  className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 text-sm focus:outline-none resize-none"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs uppercase text-slate-500 font-mono mb-2">{t.promo.lblKeywords}</label>
                <textarea 
                  value={project.keywords}
                  onChange={(e) => updateProject('keywords', e.target.value)}
                  className="flex-1 w-full bg-slate-900 border border-slate-700 p-4 rounded text-slate-300 font-mono text-sm focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a step</div>;
    }
  };

  return (
    <div className="flex h-[100dvh] bg-slate-950 text-slate-200 font-sans selection:bg-amber-900 selection:text-white overflow-hidden">
      {/* Hidden File Input for Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportProject} 
        className="hidden" 
        accept=".json"
      />

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 bg-black/80 z-20 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-500 font-bold tracking-widest text-lg">
            <Terminal size={24} />
            <span>{t.appTitle}<span className="text-slate-100">{t.appSubtitle}</span></span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setSidebarOpen(false)}><X size={24}/></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          <SidebarItem active={activeStep === StepType.SETUP} onClick={() => { setActiveStep(StepType.SETUP); setSidebarOpen(false); }} icon={Terminal} label={t.menu.setup} />
          <SidebarItem active={activeStep === StepType.ONE_LINER} onClick={() => { setActiveStep(StepType.ONE_LINER); setSidebarOpen(false); }} icon={Tag} label={t.menu.oneLiner} />
          <SidebarItem active={activeStep === StepType.SKELETON} onClick={() => { setActiveStep(StepType.SKELETON); setSidebarOpen(false); }} icon={BookOpen} label={t.menu.skeleton} />
          
          <div className="py-2 px-4 text-xs font-mono text-slate-600 uppercase tracking-widest">Deep Forge</div>
          <SidebarItem active={activeStep === StepType.CHARACTERS} onClick={() => { setActiveStep(StepType.CHARACTERS); setSidebarOpen(false); }} icon={Users} label={t.menu.characters} />
          <SidebarItem active={activeStep === StepType.WORLD} onClick={() => { setActiveStep(StepType.WORLD); setSidebarOpen(false); }} icon={Map} label={t.menu.world} />
          <SidebarItem active={activeStep === StepType.DNA} onClick={() => { setActiveStep(StepType.DNA); setSidebarOpen(false); }} icon={Dna} label={t.menu.dna} />

          <div className="py-2 px-4 text-xs font-mono text-slate-600 uppercase tracking-widest">Execution</div>
          <SidebarItem active={activeStep === StepType.OUTLINE} onClick={() => { setActiveStep(StepType.OUTLINE); setSidebarOpen(false); }} icon={FileText} label={t.menu.outline} />
          <SidebarItem active={activeStep === StepType.CHAPTER_GEN} onClick={() => { setActiveStep(StepType.CHAPTER_GEN); setSidebarOpen(false); }} icon={Skull} label={t.menu.execution} />
          <SidebarItem active={activeStep === StepType.ERROR_KILLER} onClick={() => { setActiveStep(StepType.ERROR_KILLER); setSidebarOpen(false); }} icon={ShieldAlert} label={t.menu.killHouse} />
          <SidebarItem active={activeStep === StepType.CONSISTENCY} onClick={() => { setActiveStep(StepType.CONSISTENCY); setSidebarOpen(false); }} icon={CheckCircle2} label={t.menu.intel} />
          <SidebarItem active={activeStep === StepType.POLISH} onClick={() => { setActiveStep(StepType.POLISH); setSidebarOpen(false); }} icon={Wand2} label={t.menu.polish} />
          <SidebarItem active={activeStep === StepType.COVER_ART} onClick={() => { setActiveStep(StepType.COVER_ART); setSidebarOpen(false); }} icon={ImageIcon} label={t.menu.cover} />
          <SidebarItem active={activeStep === StepType.BLURB} onClick={() => { setActiveStep(StepType.BLURB); setSidebarOpen(false); }} icon={Tag} label={t.menu.promo} />
          
          <div className="mt-6 border-t border-slate-800 pt-2">
            <SidebarItem active={activeStep === StepType.MANUAL} onClick={() => { setActiveStep(StepType.MANUAL); setSidebarOpen(false); }} icon={HelpCircle} label={t.menu.manual} />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-500 font-mono">v2.0 | GEMINI 2.5</div>
            <button 
              onClick={() => setLanguage(l => l === 'en' ? 'ru' : 'en')}
              className="flex items-center gap-2 text-xs font-bold text-amber-500 hover:text-amber-400 uppercase tracking-wider"
            >
              <Globe size={14} />
              {language}
            </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full min-w-0 md:ml-64 transition-all duration-300">
        <header className="h-auto min-h-[56px] py-2 md:py-0 md:h-16 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 bg-slate-950/80 backdrop-blur z-10 flex-wrap gap-2">
           <div className="flex items-center gap-4">
              <button className="md:hidden text-slate-400 hover:text-white p-1" onClick={() => setSidebarOpen(true)}><Menu size={24}/></button>
              <h1 className="text-slate-100 font-medium truncate text-sm md:text-base max-w-[150px] md:max-w-none">{project.title}</h1>
           </div>
           <div className="flex items-center gap-2">
             <button 
                onClick={toggleAutopilot}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all
                  ${autopilotMode 
                    ? 'bg-amber-500 text-black animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]' 
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}
                `}
             >
                {autopilotMode ? <PauseCircle size={14} /> : <Play size={14} />}
                <span className="hidden md:inline">{autopilotMode ? t.autopilotStop : t.autopilot}</span>
                <span className="md:hidden">{autopilotMode ? "STOP" : "AUTO"}</span>
             </button>
             <div className="h-6 w-px bg-slate-800 mx-1 hidden md:block"></div>
             
             <button 
              className="p-2 text-slate-400 hover:text-amber-500 transition-colors" 
              title={t.import}
              onClick={() => fileInputRef.current?.click()}
             >
               <Upload size={20} />
             </button>
             
             <button 
              className="p-2 text-slate-400 hover:text-amber-500 transition-colors" 
              title={t.save}
              onClick={handleExportProject}
             >
               <Download size={20} />
             </button>

             <button 
              className="p-2 text-slate-400 hover:text-amber-500 transition-colors" 
              title={t.help}
              onClick={() => setActiveStep(StepType.MANUAL)}
             >
               <HelpCircle size={20} />
             </button>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          {renderStepContent()}
        </main>
      </div>
    </div>
  );
}