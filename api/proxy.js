export const config = {
  runtime: 'edge', // 使用 Edge 运行时，速度快且支持流式传输
};

export default async function handler(request) {
  const url = new URL(request.url);
  // 从 vercel.json 传递的参数中获取原始路径
  const originalPath = url.searchParams.get('original_path');
  
  // 如果没有路径，说明配置有问题
  if (!originalPath) {
    return new Response("Error: Configuration Mismatch", { status: 500 });
  }

  // 移除我们需要用的这个临时参数，保留用户其他的查询参数（比如 key）
  url.searchParams.delete('original_path');

  // 构造目标 Google URL
  const targetUrl = new URL(originalPath + url.search, 'https://generativelanguage.googleapis.com');

  // 复制原始请求的 Headers，然后把暴露身份的删掉
  const newHeaders = new Headers(request.headers);
  newHeaders.delete('x-forwarded-for');
  newHeaders.delete('x-real-ip');
  newHeaders.delete('cf-connecting-ip');
  newHeaders.delete('x-vercel-ip-country');
  newHeaders.delete('host'); // 删除 host，让 fetch 自动设置

  // 发起新的请求（伪装成 Vercel 服务器自己发出的）
  const newRequest = new Request(targetUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
    duplex: 'half' // 开启流式支持
  });

  const response = await fetch(newRequest);
  return response;
}
