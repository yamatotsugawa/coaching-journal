// src/app/api/aiFeedback/route.ts

import { NextRequest, NextResponse } from 'next/server';
// OpenAI APIを使用するので、@google/generative-ai ではなく openai をインポートします
// まだインストールしていなければ、npm install openai を実行してください
import OpenAI from 'openai'; 

// ここにOpenAI APIキーを環境変数から取得する記述をします
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // .env.localで設定した名前と一致させます

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// 過去の記録エントリの型定義
interface PastRecordEntry {
  event: string;
  impression: string;
  feeling: string;
  // '気づき' プロパティは日本語名なので、そのまま使用します
  気づき: string;
  nextStep: string;
}

// リクエストボディの型定義
interface RequestBody {
  event: string;
  impression: string;
  feeling: string;
  // '気づき' プロパティは日本語名なので、そのまま使用します
  気づき: string;
  nextStep: string;
  pastRecords?: PastRecordEntry[]; // pastRecords はオプションで、PastRecordEntry の配列
}

export async function POST(req: NextRequest) {
  try {
    // リクエストボディを型安全にパース
    const { event, impression, feeling, 気づき, nextStep, pastRecords }: RequestBody = await req.json();

    // プロンプトの作成
    let prompt = `あなたは優しいメンタルコーチです。\n`;
    prompt += `以下は1人のユーザーが最近書いた日記の記録です。\n`;
    prompt += `それぞれの記録を読んで、この人の前向きな点・頑張っている点・変化の兆しなどを見つけて、優しい声かけを1〜2文で送ってください。\n`;
    prompt += `過度にテンションを上げず、敬語で丁寧だがやさしい口調でお願いします。\n`;
    prompt += `全体を200文字程度で、最後には必ず「本日も記録ありがとうございます！お疲れ様でした。」と付け加えてください。\n\n`; // ここで全ての指示が完了

    // 以下に、元の日記の記録データを追加
    prompt += `今日の出来事: ${event}\n`;
    prompt += `印象に残ったこと: ${impression}\n`;
    prompt += `感情: ${feeling}\n`;
    prompt += `気づき: ${気づき}\n`;
    prompt += `次にとりたい一歩: ${nextStep}\n`;

    // pastRecords が存在し、かつ要素がある場合にのみプロンプトに追加
    if (pastRecords && pastRecords.length > 0) {
      prompt += '\n過去の記録 (新しいものから古いものへ):\n';
      // 最大3件程度の過去の記録をプロンプトに含める
      // record に PastRecordEntry 型を明示的に指定
      pastRecords.slice(0, 3).forEach((record: PastRecordEntry, index: number) => {
        prompt += `記録 ${index + 1}:\n`;
        prompt += `出来事: ${record.event}\n`;
        prompt += `印象: ${record.impression}\n`;
        prompt += `感情: ${record.feeling}\n`;
        prompt += `気づき: ${record.気づき}\n`;
        prompt += `次の一歩: ${record.nextStep}\n\n`;
      });
    }

    // OpenAI APIにリクエストを送信 (GPT-3.5 Turboを使用)
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // または "gpt-4o" など、使用したいモデルを指定
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400, // 200文字程度にするため、余裕を持たせたトークン数（これで問題ないでしょう）
      temperature: 0.7, // 応答のランダム性を調整
    });

    // chatCompletion.choices[0].message.content が null の可能性を考慮
    const feedbackText = chatCompletion.choices[0].message.content || 'フィードバックを生成できませんでした。';

    return NextResponse.json({ feedback: feedbackText });

  } catch (error) {
    console.error('AI Feedback API Error:', error);
    // エラーオブジェクトの型を unknown として扱い、必要に応じて型ガードで詳細を確認
    let errorMessage = 'AIフィードバックの生成中にエラーが発生しました。';
    if (error instanceof Error) {
      errorMessage += ` エラー詳細: ${error.message}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
