import React from "react";
import { Cat } from "../types";

interface Props {
  cats: Cat[];
  results: {
    catId: string;
    score: number;
    reason: string;
  }[];
  onSelect: (cat: Cat) => void;
  onNone: () => void;
}

export const CatSimilarityList: React.FC<Props> = ({
  cats,
  results,
  onSelect,
  onNone,
}) => {
  return (
    <div className="space-y-3 mt-4">
      <h3 className="font-bold">類似する猫候補</h3>

      {results.map(r => {
        const cat = cats.find(c => c.id === r.catId);
        if (!cat) return null;

        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat)}
            className="w-full flex items-center gap-3 p-3 border rounded-lg"
          >
            <img src={cat.imageUrl} className="w-16 h-16 object-cover rounded" />
            <div className="text-left">
              <p className="font-bold">{cat.name}</p>
              <p className="text-xs text-gray-500">
                類似度 {Math.round(r.score * 100)}%：{r.reason}
              </p>
            </div>
          </button>
        );
      })}

      <button
        onClick={onNone}
        className="w-full py-2 border rounded text-sm text-gray-600"
      >
        該当するネコがいない
      </button>
    </div>
  );
};