import { getStore } from '@netlify/blobs';

export default async function handler(req) {
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

    const expectedToken = process.env.ADMIN_TOKEN;
    if (!expectedToken || token !== expectedToken) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const store = getStore('product-data');
    const { blobs } = await store.list();

    const stats = {};

    for (const blob of blobs) {
      const raw = await store.get(blob.key);
      // views-xxx => views count
      if (blob.key.startsWith('views-')) {
        const productId = blob.key.replace('views-', '');
        if (!stats[productId]) stats[productId] = { views: 0, likes: 0 };
        stats[productId].views = parseInt(raw || '0', 10);
      }
      // likes-count-xxx => likes count
      if (blob.key.startsWith('likes-count-')) {
        const productId = blob.key.replace('likes-count-', '');
        if (!stats[productId]) stats[productId] = { views: 0, likes: 0 };
        stats[productId].likes = parseInt(raw || '0', 10);
      }
    }

    const result = Object.entries(stats).map(([productId, data]) => ({
      productId,
      views: data.views,
      likes: data.likes,
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}