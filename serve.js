import { createServer } from 'http';
import { readFile, stat } from 'fs/promises';
import { extname, join } from 'path';

const distDir = './dist';

const server = createServer(async (req, res) => {
  let url = req.url === '/' ? '/index.html' : req.url;
  
  // 尝试直接访问文件
  let filePath = join(distDir, url);
  
  // 如果路径没有扩展名，尝试添加 .html 或访问 index.html
  if (!extname(filePath)) {
    // 尝试作为目录访问 index.html
    const dirIndexPath = join(filePath, 'index.html');
    try {
      await stat(dirIndexPath);
      filePath = dirIndexPath;
    } catch {
      // 尝试添加 .html 扩展名
      filePath = filePath + '.html';
    }
  }

  const ext = extname(filePath);
  let contentType = 'text/html';
  switch (ext) {
    case '.js': contentType = 'text/javascript'; break;
    case '.css': contentType = 'text/css'; break;
    case '.json': contentType = 'application/json'; break;
    case '.png': contentType = 'image/png'; break;
    case '.jpg': contentType = 'image/jpeg'; break;
    case '.svg': contentType = 'image/svg+xml'; break;
    case '.ico': contentType = 'image/x-icon'; break;
  }

  try {
    const content = await readFile(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`LAN access: http://192.168.121.64:${PORT}/`);
});