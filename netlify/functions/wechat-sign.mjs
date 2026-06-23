import crypto from 'node:crypto';

let cachedTicket = null;
let cachedToken = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.expires) return cachedToken.token;
  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appId || !secret) return null;

  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${appId}&secret=${secret}`);
  const data = await res.json();
  if (data.access_token) {
    cachedToken = { token: data.access_token, expires: Date.now() + (data.expires_in - 300) * 1000 };
    return data.access_token;
  }
  return null;
}

async function getJsapiTicket() {
  if (cachedTicket && Date.now() < cachedTicket.expires) return cachedTicket.ticket;
  const token = await getAccessToken();
  if (!token) return null;

  const res = await fetch(`https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${token}&type=jsapi`);
  const data = await res.json();
  if (data.ticket) {
    cachedTicket = { ticket: data.ticket, expires: Date.now() + (data.expires_in - 300) * 1000 };
    return data.ticket;
  }
  return null;
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const appId = process.env.WECHAT_APP_ID;
  const secret = process.env.WECHAT_APP_SECRET;
  if (!appId || !secret) {
    return new Response(JSON.stringify({ configured: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const url = new URL(req.url);
    const targetUrl = url.searchParams.get('url') || '';

    const ticket = await getJsapiTicket();
    if (!ticket) {
      return new Response(JSON.stringify({ error: 'failed to get ticket' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const nonceStr = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const str = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${targetUrl}`;
    const signature = crypto.createHash('sha1').update(str).digest('hex');

    return new Response(JSON.stringify({ appId, timestamp, nonceStr, signature }), {
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