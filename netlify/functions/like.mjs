import { getStore } from '@netlify/blobs';

export default async function handler(req: Request) {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return new Response(null, { status: 405 });
  }

  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const { productId } = await req.json();
    if (!productId) return new Response(JSON.stringify({ error: 'productId required' }), { status: 400 });

    const store = getStore('product-data');
    const likesKey = `likes-${productId}`;
    const countKey = `likes-count-${productId}`;

    // 从请求头获取匿名用户标识（基于 IP + UA 的简单指纹）
    const userFingerprint = req.headers.get('x-forwarded-for') || 'unknown';
    const userKey = `${likesKey}-${userFingerprint}`;

    const hasLiked = await store.get(userKey);
    const currentCount = parseInt((await store.get(countKey)) || '0', 10);

    let newCount: number;
    if (hasLiked === '1') {
      // 取消点赞
      await store.set(userKey, '0');
      newCount = Math.max(0, currentCount - 1);
    } else {
      // 点赞
      await store.set(userKey, '1');
      newCount = currentCount + 1;
    }
    await store.set(countKey, String(newCount));

    return new Response(JSON.stringify({ count: newCount, liked: hasLiked !== '1' }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}