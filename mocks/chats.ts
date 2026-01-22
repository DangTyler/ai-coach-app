export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export interface SavedChat {
  id: string;
  coachId: string;
  coachName: string;
  coachAvatar: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

export const savedChats: SavedChat[] = [
  {
    id: 'chat-1',
    coachId: '1',
    coachName: 'Maya Chen',
    coachAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Remember, your value isn\'t determined by your current salary...',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    messages: [
      { id: 'm1', content: 'How do I negotiate a 30% raise?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 35) },
      { id: 'm2', content: 'Great question! First, let\'s build your case. What are your top 3 achievements in the past year?', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 34) },
      { id: 'm3', content: 'I led the product launch, increased team productivity by 40%, and landed our biggest client.', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 32) },
      { id: 'm4', content: 'Remember, your value isn\'t determined by your current salary. These achievements are exactly the kind of concrete evidence you need. Let\'s craft your negotiation strategy...', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 30) },
    ],
  },
  {
    id: 'chat-2',
    coachId: '2',
    coachName: 'Dr. James Wright',
    coachAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'Let\'s try a simple breathing exercise to calm your mind...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    messages: [
      { id: 'm1', content: 'I can\'t stop overthinking at night', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2 - 1000 * 60 * 5) },
      { id: 'm2', content: 'I understand how frustrating that can be. Nighttime overthinking often comes from unprocessed thoughts from the day. Let\'s try a simple breathing exercise to calm your mind...', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) },
    ],
  },
  {
    id: 'chat-3',
    coachId: '3',
    coachName: 'Sarah Kim',
    coachAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'The Pomodoro technique might work well for you...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    messages: [
      { id: 'm1', content: 'How do I stop procrastinating?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 10) },
      { id: 'm2', content: 'Procrastination is often about emotion management, not time management. What task are you avoiding right now?', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 8) },
      { id: 'm3', content: 'A big presentation for next week. I keep putting it off.', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 - 1000 * 60 * 5) },
      { id: 'm4', content: 'The Pomodoro technique might work well for you. Start with just 25 minutes on the outline. No pressure to finish, just start. Would you like me to help break this down?', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24) },
    ],
  },
  {
    id: 'chat-4',
    coachId: '4',
    coachName: 'Marcus Thompson',
    coachAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    lastMessage: 'A diversified index fund approach would be perfect for your situation...',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    messages: [
      { id: 'm1', content: 'How should I invest $10k?', isUser: true, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48 - 1000 * 60 * 3) },
      { id: 'm2', content: 'A diversified index fund approach would be perfect for your situation. But first, do you have an emergency fund with 3-6 months of expenses?', isUser: false, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48) },
    ],
  },
];

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
