import { getStore } from '@netlify/blobs';

export default async function handler(req: Request) {
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    return new Response(null, { status: 405 });
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || '';
    const productId = url.searchParams.get('productId') || '';

    // 密码校验
    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const store = getStore('product-data');

    if (productId) {
      // 获取某个产品的留言
      const commentsKey = `comments-${productId}`;
      const raw = await store.get(commentsKey);
      const comments = raw ? JSON.parse(raw) : [];
      comments.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return new Response(JSON.stringify(comments), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } else {
      // 获取所有产品的留言
      const { blobs } = await store.list({ prefix: 'comments-' });
      const allComments: any[] = [];
      for (const blob of blobs) {
        const raw = await store.get(blob.key);
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) allComments.push(...list);
        }
      }
      allComments.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return new Response(JSON.stringify(allComments), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
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