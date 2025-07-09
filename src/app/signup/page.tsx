// src/app/signup/page.tsx
'use client'; // クライアントコンポーネントとして宣言（フックを使わないので不要ですが、残しておいても問題ありません）

// useState や useRouter は不要になるため、削除またはコメントアウト
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  // すべてのState（email, message, isSuccess, isLoading）を削除
  // const [email, setEmail] = useState('');
  // const [message, setMessage] = useState('');
  // const [isSuccess, setIsSuccess] = useState<boolean | null>(null);
  // const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();

  // handleSubmit 関数も完全に削除

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">アカウント作成について</h1>
        <p className="mb-6 text-center text-md text-gray-700 leading-relaxed">
          コーチングジャーナルをご利用いただきありがとうございます。<br />
          アカウントを作成するには、以下のメールアドレスまで直接ご連絡ください。<br />
          <br />
          メールアドレス: <a href="mailto:tetsugakuman@gmail.com" className="text-blue-600 hover:underline font-bold">tetsugakuman@gmail.com</a>
          <br /><br />
          メールには、以下の情報をご記載ください。<br />
          <strong>・メールアドレス（現在使用しているもの）</strong><br />
          <strong>・生年月日（例：19830724）</strong><br />
          <br />
          管理者よりアカウント情報を記載したメールをお送りいたしますので、しばらくお待ちください。
        </p>
        {/* 入力フォーム、送信ボタン、メッセージ表示などはすべて削除 */}
        {/* <form onSubmit={handleSubmit}> ... </form> ごと削除 */}
        {/*
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? '送信中...' : 'メールアドレスを送信'}
          </button>
          {message && (
            <p className={`mt-4 text-center ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        */}
      </div>
    </div>
  );
}