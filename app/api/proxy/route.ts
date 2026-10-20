import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GAS_URL =
  'https://script.google.com/macros/s/AKfycbwQ4cWW1efQ-2Q5q00Zbv47dgX_cZN9JG6-VL472o53q6NGbq7Og2H_VseIlv6dj-bwLw/exec';

function getGasUrl(): string {
  return process.env.GAS_URL?.trim() || DEFAULT_GAS_URL;
}

/**
 * リトライ機能付きサーバーサイドGAS通信フェッチャー
 */
async function fetchGasWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒タイムアウト

      const res = await fetch(url, {
        ...options,
        signal: controller.signal,
        redirect: 'follow', // GASのリダイレクト(302)を追跡
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        return res;
      }

      // 5xxエラーやGAS一時障害の場合はリトライ
      if (res.status >= 500 && attempt < retries - 1) {
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      return res;
    } catch (err: unknown) {
      lastError = err;
      if (attempt < retries - 1) {
        const delay = 500 * Math.pow(2, attempt) + Math.random() * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * GET ハンドラー
 * クラス一覧取得 (action=getClassList)、課題一覧取得 (className=...)、ヘルスチェック (action=health) などを中継
 */
export async function GET(req: NextRequest) {
  const gasBaseUrl = getGasUrl();
  const searchParams = req.nextUrl.searchParams;

  // プロキシヘルスチェック
  if (searchParams.get('action') === 'health') {
    try {
      const testRes = await fetchGasWithRetry(
        `${gasBaseUrl}?action=getClassList&t=${Date.now()}`,
        { method: 'GET' },
        2
      );
      const data = await testRes.json();
      return NextResponse.json({
        status: 'SUCCESS',
        proxyActive: true,
        gasConnected: data.status === 'SUCCESS',
        classesCount: Array.isArray(data.classes) ? data.classes.length : 0,
        timestamp: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          status: 'ERROR',
          proxyActive: true,
          gasConnected: false,
          error: msg,
          timestamp: new Date().toISOString(),
        },
        { status: 502 }
      );
    }
  }

  try {
    const targetUrl = new URL(gasBaseUrl);
    searchParams.forEach((value, key) => {
      targetUrl.searchParams.set(key, value);
    });
    // キャッシュバスターを追加
    targetUrl.searchParams.set('_proxy_t', Date.now().toString());

    const response = await fetchGasWithRetry(targetUrl.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json, text/plain, */*',
      },
    });

    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return NextResponse.json(json, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('GAS Proxy GET Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'PROXY_ERROR',
        message: 'サーバープロキシからGASへの通信に失敗しました: ' + msg,
      },
      { status: 502 }
    );
  }
}

/**
 * POST ハンドラー
 * 課題の追加 (action=add)、課題の削除 (action=delete) などを中継
 */
export async function POST(req: NextRequest) {
  const gasBaseUrl = getGasUrl();

  try {
    let bodyData: unknown;
    try {
      bodyData = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'ERROR', message: '無効なJSONリクエストボディです' },
        { status: 400 }
      );
    }

    const response = await fetchGasWithRetry(gasBaseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    });

    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    return NextResponse.json(json, {
      status: response.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('GAS Proxy POST Error:', error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        status: 'PROXY_ERROR',
        message: 'サーバープロキシからGASへの書き込み通信に失敗しました: ' + msg,
      },
      { status: 502 }
    );
  }
}
