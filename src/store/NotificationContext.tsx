import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title_zh: string;
  title_ja: string;
  content_zh: string;
  content_ja: string;
  is_read: boolean;
  created_at: any;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);

  const fetchNotifications = useCallback(async () => {
    // With onSnapshot, we don't strictly need a manual fetch, 
    // but we can keep it for compatibility if needed.
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const notificationRef = doc(db, 'notifications', id);
      await updateDoc(notificationRef, { is_read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(50)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications: Notification[] = [];
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data() as Notification;
            // Only show toast for new notifications added after initial load
            // (snapshot.metadata.hasPendingWrites is false for server changes)
            if (!snapshot.metadata.fromCache && !data.is_read) {
              setActiveToast({ ...data, id: change.doc.id });
              setTimeout(() => setActiveToast(null), 5000);
            }
          }
        });

        snapshot.forEach((doc) => {
          newNotifications.push({ ...doc.data(), id: doc.id } as Notification);
        });
        setNotifications(newNotifications);
      }, (error) => {
        console.error("Error listening to notifications:", error);
      });

      return () => unsubscribe();
    } else {
      setNotifications([]);
    }
  }, [user?.uid]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, fetchNotifications }}>
      {children}
      
      {/* Real-time Toast Notification */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-6 right-6 z-[100] w-80 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-water/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-water" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-white mb-1">
                  {localStorage.getItem('language') === 'ja' ? activeToast.title_ja : activeToast.title_zh}
                </h4>
                <p className="text-xs text-white/60 leading-relaxed">
                  {localStorage.getItem('language') === 'ja' ? activeToast.content_ja : activeToast.content_zh}
                </p>
              </div>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
