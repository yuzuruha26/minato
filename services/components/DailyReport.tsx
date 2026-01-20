
import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Home, MapPin, ChevronDown, ChevronUp, FileText, Loader2, Camera } from 'lucide-react';
import { Cat, FeedingPoint, Zone, Report } from '../types';
import { getDailySummary } from '../services/feedingRecord';

interface DailyReportProps {
  date: Date;
  onBack: () => void;
  onHome: () => void;
  cats: Cat[];
  points: FeedingPoint[];
  zones: Zone[];
}

export const DailyReport: React.FC<DailyReportProps> = ({ date, onBack, onHome, cats, points, zones }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    sickReports: any[];
    unfedCats: Cat[];
    totalUnfed: number;
  } | null>(null);
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({});

  const formattedDate = date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await getDailySummary(date, cats);
      
      // マップ用に整形（sickReportsにポイント名を付与）
      const sickWithInfo = data.sickReports.map(report => {
        const cat = cats.find(c => c.id === report.catId);
        const point = points.find(p => p.id === cat?.pointId);
        return {
          report,
          cat,
          pointName: point?.name || '不明'
        };
      });

      setSummary({
        sickReports: sickWithInfo,
        unfedCats: data.unfedCats,
        totalUnfed: data.totalUnfed
      });
      setLoading(false);
    };

    fetchData();
  }, [date, cats, points]);

  const toggleZone = (zoneId: string) => {
    setExpandedZones(prev => ({ ...prev, [zoneId]: !prev[zoneId] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center p-4">
        <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
        <p className="text-gray-500 font-bold">記録を読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 pb-20">
      <div className="max-w-4xl mx-auto w-full">
        <div className="sticky top-0 bg-[#fdfbf7]/90 backdrop-blur-sm z-10 py-4 mb-4 border-b border-orange-100 flex items-center gap-3">
          <div className="flex gap-2">
            <button onClick={onBack} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
              <ArrowLeft />
            </button>
            <button onClick={onHome} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
              <Home />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{formattedDate}</h1>
            <p className="text-xs text-gray-500 font-medium">活動実績詳細</p>
          </div>
        </div>

        <div className="space-y-8 animate-fade-in-up">
          
          {/* Section 1: Health Alerts */}
          <section>
            <h2 className="text-lg font-bold text-gray-700 border-l-4 border-red-500 pl-3 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} />
              異常・怪我の報告
              <span className="text-sm font-normal text-gray-500">({summary?.sickReports.length || 0}件)</span>
            </h2>

            {summary && summary.sickReports.length > 0 ? (
              <div className="space-y-4">
                {summary.sickReports.map((item, idx) => (
                  <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-4 shadow-sm flex gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={item.report.urgentPhoto || item.cat?.imageUrl} 
                        alt={item.cat?.name} 
                        className="w-20 h-20 rounded-lg object-cover bg-gray-200" 
                      />
                      {item.report.urgentPhoto && (
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-sm">
                          <Camera size={12} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-red-900 truncate">{item.cat?.name || '不明なネコ'}</h3>
                        <span className="text-[10px] bg-white text-red-600 px-2 py-0.5 rounded border border-red-100 font-bold whitespace-nowrap">要確認</span>
                      </div>
                      <p className="text-xs text-red-700 font-bold mt-1 flex items-center gap-1">
                        <MapPin size={12} /> {item.pointName}
                      </p>
                      <div className="mt-2 p-2 bg-white/60 rounded text-xs text-gray-700 border border-red-100 flex items-start gap-2">
                        <FileText size={12} className="mt-0.5 text-red-400 flex-shrink-0" />
                        <p className="italic">{item.report.urgentDetail || item.report.notes || '詳細なし'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-center gap-3 text-green-800">
                  <CheckCircle size={20} />
                  <span className="font-bold text-sm">この日の異常報告はありません。</span>
              </div>
            )}
          </section>

          {/* Section 2: Unfed Cats by Zone */}
          <section>
            <h2 className="text-lg font-bold text-gray-700 border-l-4 border-orange-500 pl-3 mb-4 flex items-center justify-between">
              <span>餌やり未完了ネコ</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-bold">残り {summary?.totalUnfed || 0}匹</span>
            </h2>

            <div className="space-y-4">
              {zones.map(zone => {
                const unfedInZone = summary?.unfedCats.filter(c => c.zoneId === zone.id) || [];
                const isExpanded = expandedZones[zone.id];
                
                if (unfedInZone.length === 0) {
                  return (
                    <div key={zone.id} className="bg-white p-4 rounded-xl border border-gray-100 flex justify-between items-center opacity-70">
                        <span className="font-bold text-gray-500">{zone.name}</span>
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle size={12} /> 完了
                        </span>
                    </div>
                  );
                }

                return (
                  <div key={zone.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                      <button 
                        onClick={() => toggleZone(zone.id)}
                        className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800">{zone.name}</span>
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">
                            未完了: {unfedInZone.length}匹
                          </span>
                        </div>
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                      </button>
                      
                      {isExpanded && (
                        <div className="divide-y divide-gray-100 animate-fade-in">
                          {unfedInZone.map(cat => {
                            const pointName = points.find(p => p.id === cat.pointId)?.name || '不明';
                            return (
                              <div key={cat.id} className="p-3 flex items-center gap-3 pl-6">
                                <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                                <div>
                                  <p className="font-bold text-sm text-gray-700">{cat.name}</p>
                                  <p className="text-xs text-gray-400 flex items-center gap-1">
                                      <MapPin size={10} /> {pointName}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
