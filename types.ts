
export enum StepType {
  SETUP = 'SETUP',
  ONE_LINER = 'ONE_LINER',
  SKELETON = 'SKELETON',
  CHARACTERS = 'CHARACTERS',
  WORLD = 'WORLD',
  DNA = 'DNA',
  OUTLINE = 'OUTLINE',
  CHAPTER_GEN = 'CHAPTER_GEN',
  ERROR_KILLER = 'ERROR_KILLER',
  CONSISTENCY = 'CONSISTENCY',
  POLISH = 'POLISH',
  COVER_ART = 'COVER_ART',
  BLURB = 'BLURB',
  KEYWORDS = 'KEYWORDS',
  MANUAL = 'MANUAL',
}

export interface Chapter {
  id: number;
  title: string;
  summary: string; // From outline
  content: string; // Generated text
  critique: string; // From error killer
}

export interface ProjectState {
  title: string;
  authorStyle: string;
  tone: string;
  protagonist: string;
  antagonist: string;
  setting: string;
  
  // Generated Content
  oneLiner: string;
  skeleton: string;
  
  // Deep Forge Data
  characters: string;
  world: string; // Rules + Inventory
  dna: string;   // Dialogues + Violence + Tension
  
  outlineRaw: string;
  chapters: Chapter[];
  consistencyReport: string;
  polishedManuscript: string;
  coverPrompt: string;
  blurb: string;
  keywords: string;
}

export interface GeneratorConfig {
  model: string;
  systemInstruction: string;
  temperature?: number;
}