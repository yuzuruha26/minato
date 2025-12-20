
import React, { useState } from 'react';
import { Camera, Upload, AlertCircle, CheckCircle, Search, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { analyzeCatPhoto } from '../services/geminiService';
import { AIAnalysisResult, Cat } from '../types';
import { MOCK_CATS } from '../constants';

interface PhotoUploadProps {
  onClose: () => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({ onClose }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [matchedCats, setMatchedCats] = useState<Cat[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 画像圧縮ユーティリティ: Firestoreの1MB制限を回避するため、長辺800px以下、品質0.6に圧縮
  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800; // 長辺の最大サイズ
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          // JPEG形式、品質0.6で圧縮してBase64を返す
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      // 圧縮処理を実行
      const compressedBase64 = await resizeAndCompressImage(file);
      
      // Gemini API用にヘッダーを除去
      const base64Data = compressedBase64.split(',')[1];
      
      setImage(compressedBase64);
      performAnalysis(base64Data);
    } catch (e) {
      console.error("Image processing failed:", e);
      setError("画像の読み込み・圧縮に失敗しました。別の画像を試してください。");
    }
  };

  const performAnalysis = async (base64Data: string) => {
    setAnalyzing(true);
    setResult(null);
    setError(null);
    setMatchedCats([]);

    try {
      const aiResult = await analyzeCatPhoto(base64Data);
      setResult(aiResult);

      if (aiResult.isCat && aiResult.quality === 'high') {
        const potentialMatches = MOCK_CATS.filter(cat => {
            return Math.random() > 0.8; 
        }).slice(0, 3);
        
        setMatchedCats(potentialMatches);
      }
    } catch (e) {
      console.error(e);
      setError("AI解析中にエラーが発生しました。ネットワーク接続を確認して、しばらくしてから再試行してください。");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setError(null);
    setMatchedCats([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Camera className="text-orange-500" />
            ネコ写真判定
          </h2>

          {/* Upload Area */}
          {!image && !error && (
            <div className="border-4 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center bg-gray-50 transition-colors">
              <div className="mb-6 text-center">
                <div className="bg-orange-100 p-4 rounded-full inline-flex mb-3">
                  <Camera size={40} className="text-orange-500" />
                </div>
                <p className="text-gray-500 font-medium">
                  ネコの写真をアップロードして<br />AIが特徴を解析します
                </p>
              </div>

              <div className="flex flex-col w-full gap-3 max-w-xs">
                {/* Camera Button */}
                <label className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-6 rounded-xl cursor-pointer transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2">
                  <Camera size={20} />
                  <span>カメラで撮影する</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>

                {/* Gallery Button */}
                <label className="bg-white border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-bold py-4 px-6 rounded-xl cursor-pointer transition-transform active:scale-95 flex items-center justify-center gap-2">
                  <ImageIcon size={20} />
                  <span>アルバムから選択</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>
              </div>
            </div>
          )}
          
          {/* Global Error (Before Image) */}
          {!image && error && (
             <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
                <AlertTriangle className="mx-auto text-red-500 mb-2" size={32} />
                <p className="font-bold text-red-800 mb-2">エラーが発生しました</p>
                <p className="text-sm text-red-600 mb-4">{error}</p>
                <button 
                  onClick={handleReset}
                  className="bg-red-100 hover:bg-red-200 text-red-800 font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  戻る
                </button>
             </div>
          )}

          {/* Preview & Analysis */}
          {image && (
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden shadow-lg border border-gray-100">
                <img src={image} alt="Uploaded" className="w-full object-cover max-h-64" />
                {analyzing && (
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex flex-col items-center justify-center text-white">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                    <p className="animate-pulse font-medium">AIが特徴を解析中...</p>
                  </div>
                )}
              </div>

              {/* Results or Error */}
              {!analyzing && (
                <div className="animate-fade-in-up">
                  
                  {/* Analysis Error */}
                  {error && (
                    <div className="bg-red-50 text-red-800 border border-red-200 p-4 rounded-xl mb-4 flex items-start gap-3">
                        <AlertTriangle className="shrink-0 mt-0.5" />
                        <div>
                            <p className="font-bold">解析エラー</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                  )}

                  {/* Analysis Success */}
                  {!error && result && (
                    <>
                      {/* Quality/Check Status */}
                      <div className={`p-4 rounded-xl mb-4 ${
                        !result.isCat ? 'bg-red-50 text-red-800 border border-red-100' :
                        result.quality === 'low' ? 'bg-yellow-50 text-yellow-800 border border-yellow-100' :
                        'bg-green-50 text-green-800 border border-green-100'
                      }`}>
                        <div className="flex items-start gap-3">
                          {(!result.isCat || result.quality === 'low') ? <AlertCircle className="shrink-0 mt-1" /> : <CheckCircle className="shrink-0 mt-1" />}
                          <div>
                            <p className="font-bold text-lg mb-1">
                              {!result.isCat ? 'ネコが検出されませんでした' :
                              result.quality === 'low' ? '写真が不鮮明です' :
                              '解析完了！'}
                            </p>
                            <p className="text-sm opacity-90">{result.message}</p>
                            {result.features.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {result.features.map((f, i) => (
                                  <span key={i} className="text-xs bg-white bg-opacity-60 px-2 py-1 rounded-full border border-current">
                                    {f}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cat Matching Suggestions */}
                      {result.isCat && result.quality === 'high' && (
                        <div>
                          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Search size={18} />
                            似ている候補のネコ（未チェック）
                          </h3>
                          
                          {matchedCats.length > 0 ? (
                            <div className="space-y-3">
                              {matchedCats.map(cat => (
                                <div key={cat.id} className="flex gap-4 p-3 border border-gray-200 rounded-lg hover:bg-orange-50 cursor-pointer transition-colors items-center">
                                  <img src={cat.imageUrl} alt={cat.name} className="w-16 h-16 rounded-full object-cover border-2 border-orange-100" />
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-800">{cat.name}</p>
                                    <p className="text-xs text-gray-500">{cat.features}</p>
                                  </div>
                                  <button className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold">
                                    選択
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center p-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                              <p className="text-gray-600 mb-2">該当する候補が見つかりませんでした。</p>
                              <button className="text-sm bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                                管理者に報告・新規登録依頼
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  <button 
                    onClick={handleReset}
                    className="w-full mt-6 py-3 border border-gray-300 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    別の写真を試す
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
