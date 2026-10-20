/**
 * Client API layer that sends requests through the AI Studio server proxy (/api/proxy)
 * This avoids network filter blocks on script.google.com by routing all traffic via the Next.js server.
 */

const PROXY_ENDPOINT = '/api/proxy';

/**
 * リトライ付きfetch関数
 */
export async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      const delay = Math.random() * 2000 + 800;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('リクエストに失敗しました');
}

/**
 * プロキシ経由でクラス一覧を取得する
 */
export async function apiGetClassList(): Promise<{ status: string; classes: string[] }> {
  const cacheBuster = `&t=${Date.now()}`;
  const res = await fetchWithRetry(`${PROXY_ENDPOINT}?action=getClassList${cacheBuster}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });
  return await res.json();
}

/**
 * プロキシ経由で指定したクラスの課題一覧を取得する
 */
export async function apiGetTasks(className: string): Promise<{ status: string; tasks?: any[]; message?: string }> {
  const cacheBuster = `&t=${Date.now()}`;
  const res = await fetchWithRetry(
    `${PROXY_ENDPOINT}?className=${encodeURIComponent(className)}${cacheBuster}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    }
  );
  if (!res.ok) throw new Error('ネットワークエラー');
  return await res.json();
}

/**
 * プロキシ経由で課題を追加する
 */
export async function apiAddTask(payload: {
  action: 'add';
  className: string;
  task: {
    subject: string;
    title: string;
    detail: string;
    deadline: string;
    username: string;
  };
}): Promise<{ status: string; message?: string }> {
  const res = await fetchWithRetry(PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * プロキシ経由で課題を削除する
 */
export async function apiDeleteTask(payload: {
  action: 'delete';
  className: string;
  id: string | number;
  userName: string;
}): Promise<{ status: string; message?: string }> {
  const res = await fetchWithRetry(PROXY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return await res.json();
}

/**
 * プロキシのヘルスチェック
 */
export async function apiCheckProxyHealth(): Promise<{
  status: string;
  proxyActive: boolean;
  gasConnected: boolean;
  classesCount?: number;
  error?: string;
}> {
  const res = await fetch(`${PROXY_ENDPOINT}?action=health`, {
    cache: 'no-store',
  });
  return await res.json();
}
