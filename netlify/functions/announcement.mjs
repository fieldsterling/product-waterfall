import { getStore } from '@netlify/blobs';

export default async function handler(req: Request) {
  const store = getStore('product-data');
  const key = 'announcement';

  if (req.method === 'GET') {
    const raw = await store.get(key);
    return new Response(raw || 'null', {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  if (req.method === 'POST') {
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    try {
      const body = await req.json();
      const token = req.headers.get('x-admin-token') || '';

      if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: 'unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      if (body.action === 'clear') {
        await store.delete(key);
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const data = { text: body.text || '', link: body.link || '', updatedAt: new Date().toISOString() };
      await store.set(key, JSON.stringify(data));
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  }

  return new Response(null, { status: 405 });
}