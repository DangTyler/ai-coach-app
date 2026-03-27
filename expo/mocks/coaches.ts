export interface Coach {
  id: string;
  name: string;
  tagline: string;
  category: string;
  avatar: string;
  promise: string;
  prompts: string[];
  color: string;
}

export const categories = [
  'All',
  'Career',
  'Wellness',
  'Productivity',
  'Finance',
  'Relationships',
  'Creativity',
];

export const coaches: Coach[] = [
  {
    id: '1',
    name: 'Maya Chen',
    tagline: 'Executive Career Strategist',
    category: 'Career',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    promise: 'I help ambitious professionals navigate career transitions, negotiate salaries, and build executive presence. Together, we\'ll craft your path to leadership.',
    prompts: [
      'How do I negotiate a 30% raise?',
      'Should I take this new job offer?',
      'How do I deal with a difficult manager?',
    ],
    color: '#6366F1',
  },
  {
    id: '2',
    name: 'Dr. James Wright',
    tagline: 'Mindfulness & Stress Coach',
    category: 'Wellness',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
    promise: 'Find calm in the chaos. I blend ancient wisdom with modern neuroscience to help you manage stress and build lasting resilience.',
    prompts: [
      'I can\'t stop overthinking at night',
      'How do I handle work anxiety?',
      'Guide me through a 5-min meditation',
    ],
    color: '#10B981',
  },
  {
    id: '3',
    name: 'Sarah Kim',
    tagline: 'Deep Work Specialist',
    category: 'Productivity',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    promise: 'Stop being busy, start being productive. I\'ll help you design systems that protect your focus and multiply your output.',
    prompts: [
      'How do I stop procrastinating?',
      'Create my ideal morning routine',
      'I\'m overwhelmed with tasks',
    ],
    color: '#F59E0B',
  },
  {
    id: '4',
    name: 'Marcus Thompson',
    tagline: 'Wealth Building Advisor',
    category: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    promise: 'Build wealth that lasts generations. I simplify complex financial concepts and help you create a personalized path to financial freedom.',
    prompts: [
      'How should I invest $10k?',
      'Help me create a budget',
      'Should I pay off debt or invest?',
    ],
    color: '#8B5CF6',
  },
  {
    id: '5',
    name: 'Elena Rodriguez',
    tagline: 'Relationship Architect',
    category: 'Relationships',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    promise: 'Transform your connections. Whether it\'s romantic, family, or professional relationships, I help you communicate with clarity and build deeper bonds.',
    prompts: [
      'How do I have difficult conversations?',
      'My partner and I keep fighting',
      'I struggle to set boundaries',
    ],
    color: '#EC4899',
  },
  {
    id: '6',
    name: 'Alex Turner',
    tagline: 'Creative Unblock Coach',
    category: 'Creativity',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face',
    promise: 'Unleash your creative potential. I help artists, writers, and makers break through blocks and develop sustainable creative practices.',
    prompts: [
      'I have writer\'s block',
      'How do I find my creative style?',
      'I\'m scared to share my work',
    ],
    color: '#F97316',
  },
  {
    id: '7',
    name: 'Dr. Aisha Patel',
    tagline: 'Sleep & Energy Expert',
    category: 'Wellness',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face',
    promise: 'Wake up energized every day. Using sleep science, I\'ll help you optimize your rest and unlock sustained energy throughout your day.',
    prompts: [
      'I can\'t fall asleep easily',
      'How do I fix my sleep schedule?',
      'Why am I always tired?',
    ],
    color: '#14B8A6',
  },
  {
    id: '8',
    name: 'David Park',
    tagline: 'Startup Growth Mentor',
    category: 'Career',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
    promise: 'From idea to scale. As a 3x founder, I guide entrepreneurs through the chaos of building, launching, and growing successful startups.',
    prompts: [
      'How do I validate my startup idea?',
      'Should I raise funding?',
      'How do I find co-founders?',
    ],
    color: '#3B82F6',
  },
  {
    id: '9',
    name: 'Lisa Chen',
    tagline: 'Habit Design Expert',
    category: 'Productivity',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
    promise: 'Small changes, remarkable results. I use behavioral science to help you build habits that stick and break the ones holding you back.',
    prompts: [
      'How do I build a gym habit?',
      'I keep breaking my habits',
      'Design my evening routine',
    ],
    color: '#EF4444',
  },
  {
    id: '10',
    name: 'Robert Miller',
    tagline: 'Retirement Planning Guide',
    category: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&crop=face',
    promise: 'Plan your perfect retirement. I help you understand how much you need, where to invest, and how to enjoy your golden years stress-free.',
    prompts: [
      'Am I saving enough to retire?',
      'How do 401k and IRA work?',
      'When can I retire early?',
    ],
    color: '#059669',
  },
  {
    id: '11',
    name: 'Nina Russo',
    tagline: 'Communication Coach',
    category: 'Relationships',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
    promise: 'Speak with confidence, listen with intent. I train executives and individuals to communicate persuasively in any situation.',
    prompts: [
      'How do I speak up in meetings?',
      'I\'m nervous about public speaking',
      'How do I give tough feedback?',
    ],
    color: '#7C3AED',
  },
  {
    id: '12',
    name: 'Jordan Blake',
    tagline: 'Design Thinking Mentor',
    category: 'Creativity',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
    promise: 'Think like a designer. I teach creative problem-solving frameworks that help you tackle any challenge with innovation and empathy.',
    prompts: [
      'How do I brainstorm better?',
      'Help me solve this design problem',
      'How do I think more creatively?',
    ],
    color: '#0EA5E9',
  },
];
