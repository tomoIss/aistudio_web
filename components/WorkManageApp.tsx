'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import TaskCard from '@/components/TaskCard';
import AddModal from '@/components/AddModal';
import DetailModal from '@/components/DetailModal';
import ClassModal from '@/components/ClassModal';
import UsernameModal from '@/components/UsernameModal';
import NativePopup from '@/components/NativePopup';
import {
  apiGetClassList,
  apiGetTasks,
  apiAddTask,
  apiDeleteTask,
  apiCheckProxyHealth,
} from '@/lib/api-client';
import {
  TaskItem,
  getTaskFingerprint,
  cleanupDoneFingerprints,
  formatSubmissionDeadline,
} from '@/lib/task-utils';
import { filterValidClasses } from '@/lib/school-utils';

const KEY_CLASS = 'currentClass';
const KEY_TASKS_PREFIX = 'cachedTasks_';
const USER_NAME = 'userName';
const DONE_TASKS = 'doneTasks';

export default function WorkManageApp() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [currentClass, setCurrentClass] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [doneFingerprints, setDoneFingerprints] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);

  // Connectivity and proxy status
  const [online, setOnline] = useState<boolean>(true);
  const [proxyConnected, setProxyConnected] = useState<boolean>(true);

  // Status message in main view
  const [statusMsg, setStatusMsg] = useState<string>('チョークで書き込み中...');
  const [showStatusMsg, setShowStatusMsg] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState<boolean>(false);
  const [isClassLoading, setIsClassLoading] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Modal closing debounce flag
  const isModalClosingRef = useRef<boolean>(false);

  // Native popup state
  const [popup, setPopup] = useState<{
    isOpen: boolean;
    message: string;
    type?: 'alert' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    isOpen: false,
    message: '',
  });

  const showPopup = useCallback(
    (
      message: string,
      options: {
        type?: 'alert' | 'confirm';
        confirmText?: string;
        cancelText?: string;
        onConfirm?: () => void;
        onCancel?: () => void;
      } = {}
    ) => {
      setPopup({
        isOpen: true,
        message,
        type: options.type || 'alert',
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'キャンセル',
        onConfirm: () => {
          setPopup((prev) => ({ ...prev, isOpen: false }));
          if (options.onConfirm) options.onConfirm();
        },
        onCancel: () => {
          setPopup((prev) => ({ ...prev, isOpen: false }));
          if (options.onCancel) options.onCancel();
        },
      });
    },
    []
  );

  const closePopup = useCallback(() => {
    setPopup((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // Helper to load cached tasks from localStorage
  const loadCachedTasks = useCallback((clsName: string): TaskItem[] => {
    if (typeof window === 'undefined' || !clsName) return [];
    try {
      const raw = localStorage.getItem(KEY_TASKS_PREFIX + clsName);
      if (!raw) return [];
      const cached = JSON.parse(raw);
      return Array.isArray(cached) ? cached : [];
    } catch (e) {
      console.warn('cachedTasks読み込み失敗', e);
      return [];
    }
  }, []);

  // Helper to save cached tasks
  const saveCachedTasks = useCallback((clsName: string, tasksToSave: TaskItem[]) => {
    if (typeof window === 'undefined' || !clsName) return;
    try {
      localStorage.setItem(KEY_TASKS_PREFIX + clsName, JSON.stringify(tasksToSave));
    } catch (e) {
      console.warn('cachedTasks保存失敗', e);
    }
  }, []);

  // Helper to get done tasks list
  const getStoredDoneTasks = useCallback((): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(DONE_TASKS) || '[]');
    } catch {
      return [];
    }
  }, []);

  // Check online status
  const checkConnectivity = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true;
    if (!navigator.onLine) {
      setOnline(false);
      return false;
    }
    try {
      const res = await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' });
      const ok = res.ok;
      setOnline(ok);
      return ok;
    } catch {
      setOnline(false);
      return false;
    }
  }, []);

  // Fetch class list from server proxy
  const fetchClasses = useCallback(async (): Promise<string[]> => {
    setIsClassLoading(true);
    try {
      const data = await apiGetClassList();
      const valid = filterValidClasses(data.classes || []);
      setClasses(valid);
      setProxyConnected(true);
      return valid;
    } catch (err) {
      console.error('クラスリスト取得エラー:', err);
      return [];
    } finally {
      setIsClassLoading(false);
    }
  }, []);

  // Load tasks for a given class
  const loadTasksForClass = useCallback(
    async (targetClass: string) => {
      if (!targetClass) {
        setIsClassModalOpen(true);
        return;
      }

      setShowStatusMsg(true);
      const isConnected = await checkConnectivity();

      // First check local cache
      const cached = loadCachedTasks(targetClass);
      if (cached.length > 0) {
        setTasks(cached);
        setStatusMsg(
          isConnected
            ? '最新データを取得しています...'
            : 'オフライン中：前回のデータを表示しています'
        );
      } else if (!isConnected) {
        setStatusMsg('オフライン中です。前回のデータがありません。');
        return;
      }

      if (!isConnected) {
        return;
      }

      setStatusMsg('チョークで書き込み中...');

      try {
        const result = await apiGetTasks(targetClass);
        if (result.status === 'SUCCESS') {
          setProxyConnected(true);
          const rawTasks: TaskItem[] = result.tasks || [];
          // 有効なタスクのみ抽出
          const validTasks = rawTasks.filter(
            (t) => t && (t.課題id || t.教科 || t.課題名)
          );

          setTasks(validTasks);
          saveCachedTasks(targetClass, validTasks);

          // 完了キャッシュ整理
          const existingDone = getStoredDoneTasks();
          const cleanedDone = cleanupDoneFingerprints(existingDone, validTasks);
          localStorage.setItem(DONE_TASKS, JSON.stringify(cleanedDone));
          setDoneFingerprints(cleanedDone);

          if (validTasks.length === 0) {
            setStatusMsg('現在、課題はありません。');
            setShowStatusMsg(true);
          } else {
            setShowStatusMsg(false);
          }
        } else {
          setStatusMsg('データエラー: ' + result.status);
          setShowStatusMsg(true);
        }
      } catch (err: unknown) {
        console.error('課題取得エラー:', err);
        const msg = err instanceof Error ? err.message : String(err);
        if (cached.length > 0) {
          setStatusMsg(
            `データ取得に失敗しました。前回のキャッシュを表示します。\n(${msg})`
          );
          setTasks(cached);
          setShowStatusMsg(true);
        } else {
          setStatusMsg(`取得に失敗しました。\n(${msg})`);
          setShowStatusMsg(true);
        }
      }
    },
    [checkConnectivity, loadCachedTasks, saveCachedTasks, getStoredDoneTasks]
  );

  // Initialize app state from localStorage
  useEffect(() => {
    setIsClientReady(true);
    const storedUser = localStorage.getItem(USER_NAME) || '';
    const storedClass = localStorage.getItem(KEY_CLASS) || '';
    const storedDone = getStoredDoneTasks();

    setUserName(storedUser);
    setCurrentClass(storedClass);
    setDoneFingerprints(storedDone);

    if (!storedUser) {
      setIsUsernameModalOpen(true);
    } else if (!storedClass) {
      setIsClassModalOpen(true);
      fetchClasses();
    } else {
      const cached = loadCachedTasks(storedClass);
      if (cached.length > 0) {
        setTasks(cached);
        setShowStatusMsg(false);
      }
      loadTasksForClass(storedClass);
    }

    // Health check in background
    apiCheckProxyHealth()
      .then((health) => {
        setProxyConnected(health.gasConnected);
      })
      .catch(() => {
        setProxyConnected(false);
      });

    // Listen to online/offline events
    const handleOnline = () => {
      setOnline(true);
      if (storedClass) loadTasksForClass(storedClass);
    };
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchClasses, getStoredDoneTasks, loadCachedTasks, loadTasksForClass]);

  // Handle saving initial username
  const handleSaveUsername = (newUsername: string) => {
    localStorage.setItem(USER_NAME, newUsername);
    setUserName(newUsername);
    setIsUsernameModalOpen(false);

    if (!currentClass) {
      setIsClassModalOpen(true);
      fetchClasses();
    } else {
      loadTasksForClass(currentClass);
    }
  };

  // Handle class selection
  const handleSelectClass = (selected: string) => {
    if (!selected) return;
    setCurrentClass(selected);
    localStorage.setItem(KEY_CLASS, selected);
    setIsClassModalOpen(false);
    loadTasksForClass(selected);
  };

  // Toggle task status
  const handleToggleTaskStatus = (e: React.MouseEvent, taskId: string | number) => {
    e.stopPropagation();

    const task = tasks.find((t) => String(t.課題id) === String(taskId));
    if (!task) return;

    const fp = getTaskFingerprint(task);
    let updatedDone: string[];

    if (doneFingerprints.includes(fp)) {
      updatedDone = doneFingerprints.filter((f) => f !== fp);
    } else {
      updatedDone = [...doneFingerprints, fp];
    }

    setDoneFingerprints(updatedDone);
    localStorage.setItem(DONE_TASKS, JSON.stringify(updatedDone));
  };

  // Refresh tasks
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (currentClass) {
        await loadTasksForClass(currentClass);
      }
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  // Open add modal
  const handleOpenAddModal = async () => {
    if (isModalClosingRef.current) return;
    const isConn = await checkConnectivity();
    if (!isConn) {
      showPopup('オフライン中は課題の追加ができません。');
      return;
    }
    if (!currentClass) {
      showPopup('先にクラスを設定してください。');
      setIsClassModalOpen(true);
      fetchClasses();
      return;
    }
    setIsAddModalOpen(true);
  };

  // Submit new task
  const handleSubmitNewTask = async (data: {
    subject: string;
    title: string;
    detail: string;
    deadlineRaw: string;
  }) => {
    const isConn = await checkConnectivity();
    if (!isConn) {
      showPopup('オフライン中は課題の追加ができません。');
      return;
    }

    if (!userName) {
      showPopup('ユーザー情報が設定されていません。再設定してください。');
      setIsUsernameModalOpen(true);
      return;
    }

    let formattedDeadline: string;
    try {
      formattedDeadline = formatSubmissionDeadline(data.deadlineRaw);
    } catch {
      showPopup('期限の日時が無効です。');
      return;
    }

    const payload = {
      action: 'add' as const,
      className: currentClass,
      task: {
        subject: data.subject,
        title: data.title,
        detail: data.detail,
        deadline: formattedDeadline,
        username: userName,
      },
    };

    setIsAddModalOpen(false);
    setShowStatusMsg(true);
    setStatusMsg('追加処理中...');

    try {
      const result = await apiAddTask(payload);
      if (result.status === 'SUCCESS') {
        showPopup('課題を追加しました！');
        loadTasksForClass(currentClass);
      } else {
        showPopup('追加エラー: ' + (result.message || result.status));
        setShowStatusMsg(false);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showPopup('通信エラー: ' + msg);
      setShowStatusMsg(false);
    }
  };

  // Request delete confirmation
  const handleDeleteRequest = (task: TaskItem) => {
    showPopup('本当にこの課題を削除しますか？', {
      type: 'confirm',
      confirmText: '削除する',
      cancelText: 'キャンセル',
      onConfirm: async () => {
        const isConn = await checkConnectivity();
        if (!isConn) {
          showPopup('オフライン中は課題の削除ができません。');
          return;
        }

        setSelectedTask(null);
        setShowStatusMsg(true);
        setStatusMsg('削除処理中...');

        const payload = {
          action: 'delete' as const,
          className: currentClass,
          id: task.課題id ?? '',
          userName: userName,
        };

        try {
          const result = await apiDeleteTask(payload);
          if (result.status === 'SUCCESS') {
            showPopup('課題を削除しました。');
            loadTasksForClass(currentClass);
          } else {
            showPopup('削除エラー: ' + (result.message || result.status));
            setShowStatusMsg(false);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          showPopup('通信エラー: ' + msg);
          setShowStatusMsg(false);
        }
      },
    });
  };

  // Safe modal close helper to prevent accidental fast re-clicks
  const closeModalSafe = (modalSetter: (val: boolean) => void) => {
    modalSetter(false);
    isModalClosingRef.current = true;
    setTimeout(() => {
      isModalClosingRef.current = false;
    }, 400);
  };

  if (!isClientReady) {
    return (
      <div style={{ textAlign: 'center', marginTop: 100, color: '#fff' }}>
        <div className="chalk-loader" />
        <p style={{ fontWeight: 900, fontSize: '1.2rem', marginTop: 20 }}>
          チョークで書き込み中...
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      {/* Header */}
      <Header
        currentClass={currentClass}
        isRefreshing={isRefreshing}
        proxyConnected={proxyConnected}
        onOpenClassSelect={() => {
          setIsClassModalOpen(true);
          fetchClasses();
        }}
        onRefresh={handleRefresh}
        onOpenAddModal={handleOpenAddModal}
      />

      {/* Main Task Grid */}
      <main id="task-list" className="task-grid">
        {tasks.map((task, index) => {
          const fp = getTaskFingerprint(task);
          const isDone = doneFingerprints.includes(fp);
          const key = task.課題id ? `task-${task.課題id}` : `task-${index}`;

          return (
            <TaskCard
              key={key}
              task={task}
              isDone={isDone}
              onToggleStatus={handleToggleTaskStatus}
              onClick={() => setSelectedTask(task)}
            />
          );
        })}
      </main>

      {/* Status Message */}
      {showStatusMsg && (
        <div id="status-msg" className="status-msg">
          {statusMsg}
        </div>
      )}

      {/* Modals */}
      <UsernameModal
        isOpen={isUsernameModalOpen}
        onSave={handleSaveUsername}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        isLoading={isClassLoading}
        classes={classes}
        isOnline={online}
        canCancel={Boolean(currentClass)}
        onSelectClass={handleSelectClass}
        onClose={() => closeModalSafe(setIsClassModalOpen)}
        onNotify={(msg) => showPopup(msg)}
      />

      <AddModal
        isOpen={isAddModalOpen}
        onClose={() => closeModalSafe(setIsAddModalOpen)}
        onSubmit={handleSubmitNewTask}
      />

      <DetailModal
        isOpen={Boolean(selectedTask)}
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onDeleteRequest={handleDeleteRequest}
      />

      {/* Native-style Popup Dialog */}
      <NativePopup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        confirmText={popup.confirmText}
        cancelText={popup.cancelText}
        onConfirm={popup.onConfirm}
        onCancel={popup.onCancel}
        onClose={closePopup}
      />
    </div>
  );
}
