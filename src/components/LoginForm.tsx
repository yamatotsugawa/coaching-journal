// src/components/LoginForm.tsx

'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link'; // ← この行を追加します
import styles from './LoginForm.module.css'; // CSSモジュールをインポート
import { FirebaseError } from 'firebase/app'; // FirebaseError をインポート

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: unknown) { // err の型を unknown に変更
      console.error("ログインエラー:", err);
      let errorMessage = 'ログイン中にエラーが発生しました。もう一度お試しください。';

      // エラーが FirebaseError のインスタンスであるかチェック
      if (err instanceof FirebaseError) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
            break;
          case 'auth/invalid-email':
            errorMessage = '無効なメールアドレス形式です。';
            break;
          case 'auth/too-many-requests':
            errorMessage = '何度もログインに失敗したため、一時的にロックされています。しばらくしてから再度お試しください。';
            break;
          default:
            errorMessage = `ログイン中にエラーが発生しました: ${err.message}`;
            break;
        }
      } else if (err instanceof Error) { // その他の一般的な Error インスタンス
        errorMessage = `予期せぬエラーが発生しました: ${err.message}`;
      } else if (typeof err === 'string') { // 文字列の場合
        errorMessage = `エラーが発生しました: ${err}`;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className={styles.loginFormContainer}> {/* クラス名変更 */}
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit} className={styles.form}> {/* クラス名追加 */}
        <div>
          <label htmlFor="email">メールアドレス:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">パスワード:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className={styles.error}>{error}</p>} {/* クラス名追加 */}
        <button type="submit" className={styles.submitButton}>ログイン</button> {/* クラス名追加 */}
      </form>
      <p className={styles.signupLink}>
        {/* ここを Link コンポーネントに修正しました */}
        アカウントをお持ちでない場合は <Link href="/signup">こちらで登録</Link>
      </p>
    </div>
  );
};

export default LoginForm;
