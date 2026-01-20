import React, { useState } from "react";
import { Cat } from "../types";

interface Props {
  cat: Cat;
  photoPath: string;
  onSave: (memo: string) => Promise<void>;
}

export const CatIdentifyResult: React.FC<Props> = ({
  cat,
  photoPath,
  onSave,
}) => {
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(memo);
    setSaving(false);
    alert("保存しました");
  };

  return (
    <div className="mt-6 bg-white p-4 rounded-xl border space-y-3">
      <h3 className="font-bold">選択した猫</h3>

      <div className="flex items-center gap-3">
        <img src={cat.imageUrl} className="w-16 h-16 rounded object-cover" />
        <div>
          <p className="font-bold">{cat.name}</p>
          <p className="text-xs text-gray-500">{cat.features}</p>
        </div>
      </div>

      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={3}
        placeholder="気づいた点・状況メモ（任意）"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-orange-500 text-white font-bold rounded"
      >
        {saving ? "保存中..." : "保存"}
      </button>
    </div>
  );
};
