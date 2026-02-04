import createContextHook from '@nkzw/create-context-hook';
import { useCallback } from 'react';

import { useChatStore, Message, SavedChat } from '@/store/chatStore';

export const [ChatProvider, useChats] = createContextHook(() => {
  const { chats, addChat, updateChatMessages, getChatById, deleteChat: deleteChatFromStore } = useChatStore();

  const getMessages = useCallback((chatId: string): Message[] => {
    const chat = getChatById(chatId);
    return chat?.messages || [];
  }, [getChatById]);

  const addMessage = useCallback((chatId: string, message: Message) => {
    const chat = getChatById(chatId);
    if (chat) {
      const updatedMessages = [...chat.messages, message];
      updateChatMessages(chatId, updatedMessages);
    }
  }, [getChatById, updateChatMessages]);

  const createChat = useCallback((coachId: string, coachName: string, coachAvatar: string): string => {
    return addChat(coachId);
  }, [addChat]);

  const getOrCreateChat = useCallback((coachId: string, coachName: string, coachAvatar: string, existingChatId?: string): string => {
    if (existingChatId) {
      const chat = getChatById(existingChatId);
      if (chat) {
        return existingChatId;
      }
    }
    
    return createChat(coachId, coachName, coachAvatar);
  }, [getChatById, createChat]);

  const deleteChat = useCallback((chatId: string) => {
    deleteChatFromStore(chatId);
  }, [deleteChatFromStore]);

  return {
    savedChats: chats,
    getMessages,
    addMessage,
    createChat,
    getOrCreateChat,
    deleteChat,
  };
});
