
import React, { useState } from "react";
import { X } from "lucide-react";
import { uploadPhoto } from "../services/photoUpload";
import { saveFeedingRecord } from "../services/feedingRecord";

interface PhotoUploadProps {
  onClose: () => void;
}

export default function PhotoUpload({ onClose }: PhotoUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // ① 写真アップロード
      const photoUrl = await uploadPhoto(file);

      // ② Firestore に保存
      await saveFeedingRecord({
        photoUrl,
        memo,
      });

      setSuccess(true);
      setFile(null);
      setMemo("");
      
      // Successfully saved, wait a bit then close
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (e) {
      setError("保存に失敗しました");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-fade-in-up">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold text-gray-800 mb-6 pr-8">写真とメモの保存</h2>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-500">写真を選択</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-500">メモ（例：元気に食べていました）</label>
            <textarea
              placeholder="状況や気付いたことを入力してください"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-orange-400 transition-colors"
              rows={4}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={!file || loading}
            className="w-full px-4 py-4 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-50 shadow-lg shadow-orange-100 active:scale-95 transition-all"
          >
            {loading ? "保存中..." : "写真とメモを保存"}
          </button>

          {success && (
            <p className="text-green-600 text-sm font-bold text-center animate-bounce">
              保存しました！
            </p>
          )}

          {error && (
            <p className="text-red-500 text-sm font-bold text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
