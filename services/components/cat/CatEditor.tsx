import React, { useState } from "react";
import { Cat, FeedingPoint, User } from "../../types";
import { ImagePlus, Plus, Pencil, Loader2, X } from "lucide-react";
import { compressImage } from "../../services/photoUpload";
import { uploadCatMainImage } from "../../services/catImageStorage";

const CAT_COLORS = ['黒', '白', '茶', 'グレー', 'クリーム', '赤', '銀', '不明'];
const CAT_PATTERNS = ['単色', 'キジトラ', '茶トラ', 'サバトラ', '三毛', 'サビ', 'ハチワレ', 'ブチ', 'ポイント', '縞模様', '不明'];
const CAT_FUR_TYPES = ['短毛', '長毛', '中毛', '不明'];
const CAT_TAIL_TYPES = ['長い', '短い', '中くらい', 'カギ', '団子', 'ボブテイル', 'なし', '不明'];

interface Props {
  cat: Cat;
  points: FeedingPoint[];
  isNew: boolean;
  currentUser: User;
  onSave: (cat: Cat) => Promise<void>;
  onCancel: () => void;
}

export const CatEditor: React.FC<Props> = ({
  cat,
  points,
  isNew,
  currentUser,
  onSave,
  onCancel
}) => {
  const [editData, setEditData] = useState<Cat>({ ...cat });
  const [isSaving, setIsSaving] = useState(false);

  const [featureParts, setFeatureParts] = useState({
    color: '',
    pattern: '',
    fur: '',
    tail: '',
    other: ''
  });

  const handleSave = async () => {
    if (currentUser.role !== "admin") return;

    setIsSaving(true);
    try {
      // 特徴文字列の構築
      const parts = [
        featureParts.color,
        featureParts.pattern,
        featureParts.fur,
        featureParts.tail && !featureParts.tail.includes('尻尾')
          ? featureParts.tail + '尻尾'
          : featureParts.tail
      ].filter(Boolean);

      if (featureParts.other) parts.push(featureParts.other);
      const features = parts.join(" ");

      // 画像アップロードのハンドリング
      let mainImagePath = editData.mainImagePath;
      // 新しく画像が選択された場合（data URL形式）のみアップロードを行う
      const imageBase64 = editData.imageUrl.startsWith('data:') ? editData.imageUrl : null;

      if (imageBase64) {
        mainImagePath = await uploadCatMainImage(editData.id, imageBase64);
      }

      const catToSave: Cat = {
        ...editData,
        features: features || editData.features,
        mainImagePath,
        updatedAt: Date.now(),
      };

      if (isNew && !catToSave.createdAt) {
        catToSave.createdAt = Date.now();
      }

      await onSave(catToSave);
    } catch (error) {
      console.error("Save error:", error);
      alert("猫情報の保存に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await compressImage(file);
    setEditData({ ...editData, imageUrl: compressed });
  };

  return (
    <div className="space-y-5">
      <div className="relative h-64 bg-gray-200 rounded-xl overflow-hidden">
        <img src={editData.imageUrl} className="w-full h-full object-cover" />
        <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer">
          <ImagePlus size={32} className="text-white" />
          <input type="file" className="hidden" onChange={handlePhotoChange} />
        </label>
      </div>

      <div className="bg-white p-5 rounded-xl border">
        <h3 className="text-sm font-bold text-orange-600 mb-4 flex items-center gap-2">
          {isNew ? <Plus size={16} /> : <Pencil size={16} />}
          基本情報
        </h3>

        <input
          value={editData.name}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          placeholder="名前"
          className="w-full p-3 border rounded mb-3"
        />

        <select
          value={editData.pointId}
          onChange={(e) => setEditData({ ...editData, pointId: e.target.value })}
          className="w-full p-3 border rounded"
        >
          {points.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 rounded border font-bold"
        >
          キャンセル
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 rounded bg-orange-500 text-white font-bold"
        >
          {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "保存"}
        </button>
      </div>
    </div>
  );
};