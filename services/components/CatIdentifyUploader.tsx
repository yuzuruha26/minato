import React, { useState } from "react";
import { compressImage } from "../services/photoUpload";
import { judgeCatSimilarity } from "../services/catAiJudge";
import { Cat } from "../types";

interface Props {
  cats: Cat[];
  onResult: (results: any[]) => void;
}

export const CatIdentifyUploader: React.FC<Props> = ({ cats, onResult }) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const base64 = await compressImage(file);
    const result = await judgeCatSimilarity(base64, cats);
    onResult(result);
    setLoading(false);
  };

  return (
    <div className="p-4 bg-white rounded-xl border">
      <label className="block font-bold mb-2">猫の写真をアップロード</label>
      <input type="file" accept="image/*" onChange={handleUpload} />
      {loading && <p className="text-sm text-gray-500 mt-2">AI判定中...</p>}
    </div>
  );
};
