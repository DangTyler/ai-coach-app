import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback } from 'react';

import { Message, savedChats as initialSavedChats, SavedChat } from '@/mocks/chats';

export const [ChatProvider, useChats] = createContextHook(() => {
  const [chats, setChats] = useState<Map<string, Message[]>>(() => {
    const map = new Map<string, Message[]>();
    initialSavedChats.forEach((chat) => {
      map.set(chat.id, chat.messages);
    });
    return map;
  });

  const [savedChatsList, setSavedChatsList] = useState<SavedChat[]>(initialSavedChats);

  const getMessages = useCallback((chatId: string): Message[] => {
    return chats.get(chatId) || [];
  }, [chats]);

  const addMessage = useCallback((chatId: string, message: Message) => {
    setChats((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(chatId) || [];
      newMap.set(chatId, [...existing, message]);
      return newMap;
    });

    setSavedChatsList((prev) => {
      const existingIndex = prev.findIndex((c) => c.id === chatId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          lastMessage: message.content,
          timestamp: message.timestamp,
          messages: [...updated[existingIndex].messages, message],
        };
        return updated;
      }
      return prev;
    });
  }, []);

  const createChat = useCallback((coachId: string, coachName: string, coachAvatar: string): string => {
    const chatId = `chat-${Date.now()}`;
    setChats((prev) => {
      const newMap = new Map(prev);
      newMap.set(chatId, []);
      return newMap;
    });

    const newSavedChat: SavedChat = {
      id: chatId,
      coachId,
      coachName,
      coachAvatar,
      lastMessage: '',
      timestamp: new Date(),
      messages: [],
    };

    setSavedChatsList((prev) => [newSavedChat, ...prev]);
    return chatId;
  }, []);

  const getOrCreateChat = useCallback((coachId: string, coachName: string, coachAvatar: string, existingChatId?: string): string => {
    if (existingChatId && chats.has(existingChatId)) {
      return existingChatId;
    }
    
    const existingChat = savedChatsList.find((c) => c.coachId === coachId && !existingChatId);
    if (existingChat) {
      return existingChat.id;
    }

    return createChat(coachId, coachName, coachAvatar);
  }, [chats, savedChatsList, createChat]);

  return {
    savedChats: savedChatsList,
    getMessages,
    addMessage,
    createChat,
    getOrCreateChat,
  };
});
