import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { AIPrompt, ImageCard, WordCard } from '../core/types';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: () => adminService.getDashboardStats(),
  });
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminService.getAllUsers(),
  });
};

export const useAdminSessions = () => {
  return useQuery({
    queryKey: ['admin', 'sessions'],
    queryFn: () => adminService.getAllSessions(),
  });
};

export const useAdminCards = () => {
  return useQuery({
    queryKey: ['admin', 'cards'],
    queryFn: async () => {
      const [images, words] = await Promise.all([
        adminService.getAllImageCards(),
        adminService.getAllWordCards()
      ]);
      return { images, words };
    },
  });
};

export const useAdminSubscriptions = () => {
  return useQuery({
    queryKey: ['admin', 'subscriptions'],
    queryFn: () => adminService.getSubscriptionData(),
  });
};

export const useAdminPrompts = (category?: string) => {
  return useQuery({
    queryKey: ['admin', 'prompts', category],
    queryFn: () => adminService.getAllPrompts(category),
  });
};

export const useAdminAnalytics = () => {
  return useQuery({
    queryKey: ['admin', 'analytics'],
    queryFn: () => adminService.getAnalyticsData(),
  });
};

// Mutations for better stability and cache invalidation
export const useSaveCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, data }: { type: 'image' | 'word'; data: any }) => {
      if (type === 'image') return adminService.saveImageCard(data);
      return adminService.saveWordCard(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cards'] });
    },
  });
};

export const useDeleteCardMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, id }: { type: 'image' | 'word'; id: string }) => {
      if (type === 'image') return adminService.deleteImageCard(id);
      return adminService.deleteWordCard(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'cards'] });
    },
  });
};

export const useSavePromptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prompt: Partial<AIPrompt>) => adminService.savePrompt(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] });
    },
  });
};

export const useDeletePromptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deletePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] });
    },
  });
};

export const useActivatePromptMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.activatePrompt(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'prompts'] });
    },
  });
};

export const useDeleteSessionDraftsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminService.deleteSessionDrafts(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
};

export const useAdminSettings = (key: string) => {
  return useQuery({
    queryKey: ['admin', 'settings', key],
    queryFn: () => adminService.getSettings(key),
  });
};

export const useSaveSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: any }) => adminService.saveSettings(key, value),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings', variables.key] });
    },
  });
};

export const useAdminMusic = () => {
  return useQuery({
    queryKey: ['admin', 'music'],
    queryFn: () => adminService.getAllMusic(),
  });
};

export const useSaveMusicMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (track: any) => adminService.saveMusic(track),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'music'] });
      queryClient.invalidateQueries({ queryKey: ['music'] }); // Also invalidate public music list
    },
  });
};

export const useDeleteMusicMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.deleteMusic(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'music'] });
      queryClient.invalidateQueries({ queryKey: ['music'] }); // Also invalidate public music list
    },
  });
};
