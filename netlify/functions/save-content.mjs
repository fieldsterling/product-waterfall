import { Buffer } from 'node:buffer';

function buildFrontmatter(data) {
  const lines = ['---'];
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      lines.push(`${key}: [${value.join(', ')}]`);
    } else if (typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (typeof value === 'number') {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: "${String(value).replace(/"/g, '\\"')}"`);
    }
  }
  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-admin-token',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405 });
  }

  // Auth
  const token = req.headers.get('x-admin-token') || '';
  const expectedToken = process.env.ADMIN_TOKEN;
  if (!expectedToken || token !== expectedToken) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  const ghToken = process.env.GITHUB_TOKEN;
  const ghRepo = process.env.GITHUB_REPO;
  const ghBranch = process.env.GITHUB_BRANCH || 'main';

  if (!ghToken || !ghRepo) {
    return new Response(JSON.stringify({ error: 'Github not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const body = await req.json();
    const { type, slug, data: contentData } = body;

    if (!type || !slug || !contentData) {
      return new Response(JSON.stringify({ error: 'missing fields' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const contentDir = type === 'product' ? 'src/content/products' : 'src/content/stores';
    const contentField = 'content';
    const markdownBody = contentData[contentField] || '';
    delete contentData[contentField];

    // Build frontmatter consumer fields (user-friendly) vs content schema fields
    const frontmatter = {};
    // Map from form fields to frontmatter keys
    for (const [key, value] of Object.entries(contentData)) {
      if (value === '' || value === null || value === undefined) continue;
      if (key === 'tags' || key === 'images') {
        // Comma-separated string to array
        const arr = typeof value === 'string'
          ? value.split(',').map((s) => s.trim()).filter(Boolean)
          : (Array.isArray(value) ? value : []);
        if (arr.length > 0) frontmatter[key] = arr;
      } else {
        frontmatter[key] = value;
      }
    }

    const fileContent = buildFrontmatter(frontmatter) + markdownBody;
    const filePath = `${contentDir}/${slug}.md`;
    const apiUrl = `https://api.github.com/repos/${ghRepo}/contents/${filePath}`;

    // Get existing file SHA (if updating)
    let sha = null;
    try {
      const getRes = await fetch(apiUrl + `?ref=${ghBranch}`, {
        headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github.v3+json' },
      });
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }
    } catch (_) {
      // File doesn't exist yet - that's fine
    }

    const putBody = {
      message: sha ? `Update ${slug}` : `Create ${slug}`,
      content: Buffer.from(fileContent, 'utf-8').toString('base64'),
      branch: ghBranch,
    };
    if (sha) putBody.sha = sha;

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(putBody),
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      return new Response(JSON.stringify({ error: errData.message || 'GitHub API error' }), {
        status: putRes.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ success: true, slug }), {
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