// src/app/dashboard/page.tsx

'use client'; // クライアントコンポーネントであることを宣言

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase'; // firebase設定をインポート
// Timestamp と FieldValue をインポート
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp, FieldValue } from 'firebase/firestore';

// JournalEntry の型定義 (必要であればファイル分割)
interface JournalEntry {
  id: string;
  event: string;
  impression: string;
  feeling: string;
  気づき: string;
  nextStep: string;
  // Firebase Timestamp または FieldValue を使用するため、型を修正
  timestamp: Timestamp | FieldValue; 
  userId: string;
}

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // フォームのstate
  const [event, setEvent] = useState('');
  const [impression, setImpression] = useState('');
  const [feeling, setFeeling] = useState('');
  const [気づき, set気づき] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 過去の記録のstate
  const [pastRecords, setPastRecords] = useState<JournalEntry[]>([]);

  // AIフィードバックモーダルのstate
  const [showAiFeedbackModal, setShowAiFeedbackModal] = useState(false);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState('');

  // 認証状態の監視とデータ読み込み
  useEffect(() => {
    if (loading) return; // Firebaseの認証状態がロード中の場合は何もしない
    if (!user) {
      router.push('/login'); // ユーザーがログインしていなければログインページへリダイレクト
      return;
    }

    console.log('User is authenticated. UID:', user.uid); // デバッグログ

    // Firestoreからデータをリアルタイムで読み込む
    const q = query(
      collection(db, 'coaching'), // コレクション名を 'coaching' に変更
      orderBy('timestamp', 'desc') // 最新の記録を上に表示
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: JournalEntry[] = [];
      snapshot.forEach((doc) => {
        // doc.data() の戻り値は unknown なので、JournalEntry 型にアサーション
        const data = doc.data() as Omit<JournalEntry, 'id'>;
        // ログインユーザー自身の記録のみを表示
        if (data.userId === user.uid) {
          records.push({ id: doc.id, ...data });
        }
      });
      console.log('Fetched past records:', records); // デバッグログ
      setPastRecords(records);
    }, (err) => {
      console.error("Error fetching documents: ", err); // デバッグログ
      setError("記録の読み込み中にエラーが発生しました: " + err.message);
    });

    // クリーンアップ関数
    return () => unsubscribe();
  }, [user, loading, router]);

  // フォーム送信時の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // エラーメッセージをリセット

    if (!user) {
      setError('ユーザーが認証されていません。再度ログインしてください。');
      console.error('Submission failed: User not authenticated.'); // デバッグログ
      return;
    }

    try {
      console.log('--- 記録保存を開始します ---'); // デバッグログ
      console.log('Attempting to save with:', { event, impression, feeling, 気づき, nextStep, userId: user.uid }); // デバッグログ

      // Firestoreにデータを保存
      await addDoc(collection(db, 'coaching'), { // コレクション名を 'coaching' に変更
        userId: user.uid,
        timestamp: serverTimestamp(),
        event,
        impression,
        feeling,
        気づき,
        nextStep,
      });
      console.log('--- 記録保存が完了しました ---'); // デバッグログ

      // フォームをクリア
      setEvent('');
      setImpression('');
      setFeeling('');
      set気づき('');
      setNextStep('');

      // AIフィードバックをリクエスト
      console.log('--- AIフィードバックのリクエストを開始します ---'); // デバッグログ
      await getAiFeedback();
      console.log('--- AIフィードバックのリクエスト処理が完了しました ---'); // デバッグログ

    } catch (error: unknown) { // error の型を unknown に変更
      console.error('記録の保存中にエラーが発生しました:', error); // デバッグログ
      let errorMessage = '記録の保存中にエラーが発生しました。';
      if (error instanceof Error) { // Error インスタンスであるかチェック
        errorMessage += error.message;
      } else if (typeof error === 'string') { // 文字列の場合
        errorMessage += error;
      } else { // その他の不明な型の場合
        errorMessage += '不明なエラーが発生しました。';
      }
      setError(errorMessage);
    }
  };

  // AIフィードバックを取得する関数
  const getAiFeedback = async () => {
    console.log('getAiFeedback 関数が呼ばれました'); // デバッグログ
    try {
      const response = await fetch('/api/aiFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event,
          impression,
          feeling,
          気づき,
          nextStep,
          pastRecords: pastRecords.map(record => ({ // 過去の記録も渡す
            event: record.event,
            impression: record.impression,
            feeling: record.feeling,
            気づき: record.気づき,
            nextStep: record.nextStep,
          }))
        }),
      });

      console.log('APIレスポンスオブジェクト:', response); // デバッグログ

      if (!response.ok) {
        const errorData = await response.json();
        console.error('AI Feedback API 応答エラー:', response.status, errorData); // デバッグログ
        setError(`AIフィードバックの取得中にエラーが発生しました: ${response.status} - ${errorData.error || '不明なエラー'}`);
        return; // エラーなのでここで処理を終了
      }

      const data = await response.json();
      console.log('AIフィードバックデータ:', data); // デバッグログ

      if (data.feedback) {
        setAiFeedbackMessage(data.feedback);
        setShowAiFeedbackModal(true); // モーダルを表示
      } else if (data.error) {
        setError(data.error);
      } else {
        // feedback も error もない場合（AIが空の応答を返したなど）
        setAiFeedbackMessage("AIからのフィードバックはありませんでした。");
        setShowAiFeedbackModal(true); // 空でもモーダルは表示する
      }
    } catch (error: unknown) { // error の型を unknown に変更
      console.error('AIフィードバックの取得中に予期せぬエラーが発生しました:', error); // デバッグログ
      let errorMessage = 'AIフィードバックの取得中に予期せぬエラーが発生しました: ';
      if (error instanceof Error) { // Error インスタンスであるかチェック
        errorMessage += error.message;
      } else if (typeof error === 'string') { // 文字列の場合
        errorMessage += error;
      } else { // その他の不明な型の場合
        errorMessage += '不明なエラーが発生しました。';
      }
      setError(errorMessage);
    }
  };

  // モーダルを閉じる関数
  const closeAiFeedbackModal = () => {
    setShowAiFeedbackModal(false);
    setAiFeedbackMessage('');
    setError(null); // モーダルを閉じるときにエラーメッセージもクリア
  };

  // ログイン情報がロード中の表示
  if (loading) {
    return <p>Loading user data...</p>;
  }

  // ユーザーがログインしていない場合の表示
  if (!user) {
    return <p>Redirecting to login...</p>; // 実際のリダイレクトはuseEffectで行われる
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">コーチングジャーナル</h1>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 今日の記録フォーム */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">今日の記録</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="event" className="block text-gray-700 text-sm font-bold mb-2">今日の出来事:</label>
              <textarea
                id="event"
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="impression" className="block text-gray-700 text-sm font-bold mb-2">印象に残ったこと:</label>
              <textarea
                id="impression"
                value={impression}
                onChange={(e) => setImpression(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="feeling" className="block text-gray-700 text-sm font-bold mb-2">感情:</label>
              <textarea
                id="feeling"
                value={feeling}
                onChange={(e) => setFeeling(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="気づき" className="block text-gray-700 text-sm font-bold mb-2">気づき:</label>
              <textarea
                id="気づき"
                value={気づき}
                onChange={(e) => set気づき(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                required
              />
            </div>
            <div className="mb-6">
              <label htmlFor="nextStep" className="block text-gray-700 text-sm font-bold mb-2">次にとりたい一歩:</label>
              <textarea
                id="nextStep"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-none"
                required
              />
            </div>
            {/* エラーメッセージの表示を分かりやすくするため、モーダルの下にも表示を残す */}
            {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>}
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              記録する
            </button>
          </form>
        </div>

        {/* 過去の記録の表示 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">過去の記録</h2>
          {pastRecords.length === 0 ? (
            <p className="text-gray-600">まだ記録がありません。</p>
          ) : (
            <div>
              {pastRecords.map((record) => (
                <div key={record.id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0">
                  {/* timestamp が Timestamp 型であることを確認してから toDate() を呼び出す */}
                  <p className="text-gray-500 text-sm mb-2">日付: {
                    record.timestamp instanceof Timestamp 
                      ? new Date(record.timestamp.toDate()).toLocaleString()
                      : '日付不明' // FieldValue の場合は表示しないか、別の処理を行う
                  }</p>
                  <p className="text-gray-800 font-medium">今日の出来事: <span className="font-normal">{record.event}</span></p>
                  <p className="text-gray-800 font-medium">印象に残ったこと: <span className="font-normal">{record.impression}</span></p>
                  <p className="text-gray-800 font-medium">感情: <span className="font-normal">{record.feeling}</span></p>
                  <p className="text-gray-800 font-medium">気づき: <span className="font-normal">{record.気づき}</span></p>
                  <p className="text-gray-800 font-medium">次にとりたい一歩: <span className="font-normal">{record.nextStep}</span></p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AIフィードバックモーダル */}
      {showAiFeedbackModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center p-4 z-50"> {/* z-indexを追加 */}
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">AIからのフィードバック</h3>
            <p className="text-gray-700 mb-6 whitespace-pre-wrap">{aiFeedbackMessage}</p>
            {error && <p className="text-red-500 text-xs italic mb-4 text-center">{error}</p>} {/* モーダル内でもエラーを表示 */}
            <button
              onClick={closeAiFeedbackModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
