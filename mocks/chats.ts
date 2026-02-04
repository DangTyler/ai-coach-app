// Message and SavedChat types are now in store/chatStore.ts
// Re-export them for backwards compatibility
export type { Message, SavedChat } from '@/store/chatStore';

export interface ContextCard {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
}

export const defaultContextCards: ContextCard[] = [
  {
    id: 'goal',
    title: 'Goal',
    content: 'I want to advance my career and earn more money while maintaining work-life balance.',
    enabled: true,
  },
  {
    id: 'constraints',
    title: 'Constraints',
    content: 'I have 2 kids and limited time. I can dedicate about 5 hours per week to self-improvement.',
    enabled: true,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    content: 'I prefer actionable advice over theory. I like step-by-step plans and accountability.',
    enabled: false,
  },
];
