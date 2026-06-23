/**
 * 图片路径处理
 * 本地开发：使用相对路径 /images/
 * 生产环境：使用 COS URL
 */

const IMAGE_BASE_URL = import.meta.env.IMAGE_BASE_URL || '';

export function getImageUrl(path) {
  if (!path) return '';

  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // 相对路径，加上环境配置的 base URL
  if (IMAGE_BASE_URL) {
    return `${IMAGE_BASE_URL}${path}`;
  }

  // 本地开发环境
  return path;
}
