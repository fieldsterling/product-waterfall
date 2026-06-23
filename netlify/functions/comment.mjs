import { getStore } from '@netlify/blobs';

export default async function handler(req: Request) {
  if (req.method !== 'POST' && req.method !== 'OPTIONS') {
    return new Response(null, { status: 405 });
  }

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
    const { productId, name, phone, wechat, content } = await req.json();

    if (!productId || !content || !content.trim()) {
      return new Response(JSON.stringify({ error: 'productId and content required' }), { status: 400 });
    }

    const store = getStore('product-data');
    const commentsKey = `comments-${productId}`;
    const existing = await store.get(commentsKey);
    const comments = existing ? JSON.parse(existing) : [];

    comments.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      productId,
      name: (name || '').trim(),
      phone: (phone || '').trim(),
      wechat: (wechat || '').trim(),
      content: content.trim(),
      time: new Date().toISOString(),
    });

    await store.set(commentsKey, JSON.stringify(comments));

    return new Response(JSON.stringify({ success: true }), {
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