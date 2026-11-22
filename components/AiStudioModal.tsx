import React, { useState, useEffect } from 'react';
import { X, Sparkles, Key, CheckCircle, AlertCircle, ExternalLink, Trash2, ShieldCheck, Loader2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey, clearStoredApiKey, testApiKey } from '../services/apiKeyStorage';

interface AiStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiStudioModal: React.FC<AiStudioModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey();
      setApiKey(stored);
      setStatusMessage(null);
      setTesting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      setStatusMessage({ type: 'error', text: 'APIキーを入力してください。' });
      return;
    }
    setTesting(true);
    setStatusMessage({ type: 'info', text: 'Google AI Studioと通信中...' });
    
    const result = await testApiKey(trimmed);
    setTesting(false);
    if (result.success) {
      setStatusMessage({ type: 'success', text: result.message });
    } else {
      setStatusMessage({ type: 'error', text: result.message });
    }
  };

  const handleSave = () => {
    const trimmed = apiKey.trim();
    setStoredApiKey(trimmed);
    if (trimmed) {
      setStatusMessage({ type: 'success', text: 'APIキーを保存しました。せつぞくテストで通信を確認できます。' });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage({ type: 'info', text: 'APIキーを解除しました（れんしゅうモードで動作します）。' });
    }
  };

  const handleClear = () => {
    clearStoredApiKey();
    setApiKey('');
    setStatusMessage({ type: 'info', text: 'APIキーを削除しました。' });
  };

  const isConnected = !!getStoredApiKey();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-4 border-brand-yellow overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-yellow/30 to-brand-orange/20 px-6 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-brand-orange text-white p-2 rounded-xl shadow-sm">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-gray-800">Google AI Studio れんけい</h2>
              <p className="text-[11px] font-bold text-gray-500">Gemini AI による手書き漢字採点</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-left">
          {/* Status Badge */}
          <div className={`p-3 rounded-2xl flex items-center gap-3 ${
            isConnected ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
          }`}>
            {isConnected ? (
              <CheckCircle className="text-green-600 shrink-0" size={24} />
            ) : (
              <ShieldCheck className="text-brand-blue shrink-0" size={24} />
            )}
            <div>
              <p className="text-xs font-black text-gray-800">
                {isConnected ? '🔑 APIキー保存済み（通信は接続テストで確認）' : '⚪ れんしゅうモード（自動採点なし）'}
              </p>
              <p className="text-[11px] text-gray-600 font-medium">
                {isConnected 
                  ? 'Gemini 3.1 Flash-Lite による手書き文字のAI認識が有効です。' 
                  : '漢字を書く練習はできます。正誤の自動採点にはAPIキーが必要です。'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="text-xs text-gray-600 space-y-1">
            <p className="font-bold text-gray-700">Google AI Studioと連携すると：</p>
            <ul className="list-disc pl-5 space-y-0.5 text-[11px] text-gray-600">
              <li>お子様の手書き文字の形をAIがていねいに認識</li>
              <li>「はらい」や「とめ」など、励みになる個別アドバイス</li>
            </ul>
          </div>

          {/* Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key size={14} className="text-brand-orange" />
                Gemini API キー（AQ.… / AIza…）
              </span>
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="text-[10px] text-brand-blue hover:underline"
              >
                {showKey ? 'かくす' : 'ひょうじ'}
              </button>
            </label>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Google AI Studioでコピーしたキー"
              className="w-full px-3.5 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:border-brand-blue focus:bg-white transition"
            />
            <p className="text-[10px] text-gray-400">
              ※ キーはこのブラウザに保存され、接続テスト・AI採点時にGoogleのGemini APIへ送信されます。制作元のサーバーには保存しません。
            </p>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-fade-in ${
              statusMessage.type === 'success' ? 'bg-green-100 text-green-800' :
              statusMessage.type === 'error' ? 'bg-red-100 text-red-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle size={16} className="shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle size={16} className="shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <Loader2 size={16} className="shrink-0 mt-0.5 animate-spin" />}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTest}
              disabled={testing || !apiKey.trim()}
              className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:opacity-40 text-gray-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              せつぞくテスト
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 px-3 bg-brand-orange hover:bg-orange-600 active:scale-95 text-white font-black text-xs rounded-xl shadow-md transition"
            >
              ほぞんする
            </button>
            {isConnected && (
              <button
                onClick={handleClear}
                title="キーを解除"
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {/* Guide Section */}
          <div className="mt-4 pt-4 border-t border-gray-100 bg-gray-50 -mx-6 -mb-6 p-6 rounded-b-2xl">
            <p className="text-xs font-black text-gray-700 mb-2">💡 無料キーの取得手順</p>
            <ol className="text-[11px] text-gray-600 space-y-1 list-decimal pl-4 mb-3">
              <li>Google AI Studio にアクセス</li>
              <li>Googleアカウントでログイン</li>
              <li>「Get API key」ボタンからキーを新規作成</li>
              <li>コピーしたキーを上の枠に貼り付けて「ほぞんする」</li>
            </ol>
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-black text-brand-blue hover:text-blue-700 hover:underline"
            >
              Google AI Studio でキーを取得する（無料）
              <ExternalLink size={13} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiStudioModal;
