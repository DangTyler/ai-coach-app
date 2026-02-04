import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { coaches } from '@/mocks/coaches';

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

interface ChatStore {
  chats: SavedChat[];
  
  // Actions
  addChat: (coachId: string) => string; // Returns new chatId
  deleteChat: (chatId: string) => void;
  updateChatMessages: (chatId: string, messages: Message[]) => void;
  getChatsForCoach: (coachId: string) => SavedChat[];
  getChatById: (chatId: string) => SavedChat | undefined;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],

      addChat: (coachId: string) => {
        const coach = coaches.find((c) => c.id === coachId);
        if (!coach) {
          throw new Error(`Coach with id ${coachId} not found`);
        }

        const chatId = `chat-${Date.now()}`;
        const newChat: SavedChat = {
          id: chatId,
          coachId: coach.id,
          coachName: coach.name,
          coachAvatar: coach.avatar,
          lastMessage: '',
          timestamp: new Date(),
          messages: [],
        };

        set((state) => ({
          chats: [newChat, ...state.chats],
        }));

        return chatId;
      },

      deleteChat: (chatId: string) => {
        set((state) => ({
          chats: state.chats.filter((chat) => chat.id !== chatId),
        }));
      },

      updateChatMessages: (chatId: string, messages: Message[]) => {
        set((state) => ({
          chats: state.chats.map((chat) => {
            if (chat.id === chatId) {
              const lastMessage = messages.length > 0 
                ? messages[messages.length - 1].content 
                : '';
              return {
                ...chat,
                messages,
                lastMessage,
                timestamp: new Date(),
              };
            }
            return chat;
          }),
        }));
      },

      getChatsForCoach: (coachId: string) => {
        return get().chats
          .filter((chat) => chat.coachId === coachId)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      },

      getChatById: (chatId: string) => {
        return get().chats.find((chat) => chat.id === chatId);
      },
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Handle date serialization
      partialize: (state) => ({ chats: state.chats }),
      onRehydrateStorage: () => (state) => {
        // Convert date strings back to Date objects after rehydration
        if (state?.chats) {
          state.chats = state.chats.map((chat) => ({
            ...chat,
            timestamp: new Date(chat.timestamp),
            messages: chat.messages.map((msg) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
          }));
        }
      },
    }
  )
);
