// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export', // 静的エクスポートを有効にする

  // GitHub Pagesのサブディレクトリにデプロイする場合に必要
  // リポジトリ名が 'your-username.github.io' 形式でない場合、
  // 例えばリポジトリ名が 'coaching-journal' なら '/coaching-journal' を設定
  basePath: process.env.NODE_ENV === 'production' ? '/coaching-journal' : '', // ★ここをあなたのリポジトリ名に合わせる
  assetPrefix: process.env.NODE_ENV === 'production' ? '/coaching-journal/' : '', // ★ここもあなたのリポジトリ名に合わせる
};

export default nextConfig;
