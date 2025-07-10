// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercelにデプロイする場合、output: 'export' は通常不要です。
  // Vercelが自動でサーバーレス関数として最適化してくれます。
  // この行を削除します。
  // output: 'export', 

  // Vercelは自動でパスを処理するため、basePath と assetPrefix は不要です。
  basePath: '',       // 空のまま
  assetPrefix: '',    // 空のまま
  
  // 画像の最適化はVercelのImage Optimizationが自動で処理するため、
  // unoptimized: true は削除したままにします。
  images: {
    // unoptimized: true, // この行は削除したまま
  },
};

export default nextConfig;
