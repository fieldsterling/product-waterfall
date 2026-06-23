/**
 * 图片配置 - 管理本地图片和 COS 图片路径
 * 
 * 使用方式：
 * 1. 本地开发：图片放在 public/images/ 目录下
 * 2. 上传 COS：图片放到 COS 桶的对应目录
 * 
 * 图片路径格式：
 * - 产品图片：/images/products/xxx.jpg
 * - 门店图片：/images/stores/xxx.jpg
 * - 通用图片：/images/common/xxx.jpg
 */

// 获取图片完整 URL
export function getImageUrl(path, type = 'products') {
  if (!path) return '';
  
  // 如果已经是完整 URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 相对路径处理
  // 如果路径以 / 开头，说明是 public 目录下的路径
  if (path.startsWith('/')) {
    return path;
  }
  
  // 相对路径加上类型前缀
  return `/images/${type}/${path}`;
}

// 导出快捷方法
export const imageUrl = (path, type) => getImageUrl(path, type);
