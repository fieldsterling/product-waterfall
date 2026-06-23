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
    const { productId } = await req.json();
    if (!productId) return new Response(JSON.stringify({ error: 'productId required' }), { status: 400 });

    const store = getStore('product-data');
    const countKey = `views-${productId}`;
    const current = parseInt((await store.get(countKey)) || '0', 10);
    await store.set(countKey, String(current + 1));

    return new Response(JSON.stringify({ views: current + 1 }), {
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