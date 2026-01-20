
import React, { useState } from "react";
import { Cat } from "./types";
import { CatIdentifyUploader } from "./components/CatIdentifyUploader";
import { CatSimilarityList } from "./components/CatSimilarityList";
import { CatIdentifyResult } from "./components/CatIdentifyResult";
import { saveCatReport } from "./services/reportStorage";

export const CatIdentifyFlow: React.FC<{ cats: Cat[] }> = ({ cats }) => {
  const [results, setResults] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  const [photoPath, setPhotoPath] = useState<string>("temp/path.jpg");

  return (
    <div className="space-y-4">
      {!results.length && (
        <CatIdentifyUploader
          cats={cats}
          onResult={(r) => setResults(r)}
        />
      )}

      {results.length > 0 && !selectedCat && (
        <CatSimilarityList
          cats={cats}
          results={results}
          onSelect={(cat) => setSelectedCat(cat)}
          onNone={() => alert("次は新規登録フロー")}
        />
      )}

      {selectedCat && (
        <CatIdentifyResult
          cat={selectedCat}
          photoPath={photoPath}
          onSave={(memo) =>
            saveCatReport({
              catId: selectedCat.id,
              photoPath,
              memo,
            })
          }
        />
      )}
    </div>
  );
};
