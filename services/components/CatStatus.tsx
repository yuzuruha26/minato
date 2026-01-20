import React, { useState, useEffect } from 'react';
import { Cat, FeedingPoint, Report, User, Zone } from '../types';
import { storage as dataStorage } from '../services/storage';
import { compressImage } from '../services/photoUpload';
import { ArrowLeft, Check, AlertTriangle, Save, Droplets, Pencil, X, Camera, MapPin, Home, AlertCircle, Loader2, Plus } from 'lucide-react';
import { CatEditor } from "./cat/CatEditor";

interface CatStatusProps {
  point: FeedingPoint;
  onUpdatePoint?: (point: FeedingPoint) => void;
  cats: Cat[];
  onUpdateCat: (cat: Cat) => void;
  onAddCat: (cat: Cat) => void;
  isWatered: boolean;
  onToggleWater: () => void;
  onBack: () => void;
  onHome: () => void;
  currentUser: User;
  points: FeedingPoint[];
  zones: Zone[];
}

export const CatStatus: React.FC<CatStatusProps> = ({ point, onUpdatePoint, cats, onUpdateCat, onAddCat, isWatered, onToggleWater, onBack, onHome, currentUser, points, zones }) => {
  const filteredCats = cats.filter(c => c.pointId === point.id || c.subPointIds?.includes(point.id));
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  
  const [reportForm, setReportForm] = useState<Partial<Report>>({
    fed: false,
    watered: false,
    condition: 'good',
    notes: '',
    urgentDetail: '',
    urgentPhoto: '',
    attentionDetail: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [editData, setEditData] = useState<Cat | null>(null);

  const [isEditingPoint, setIsEditingPoint] = useState(false);
  const [editPointName, setEditPointName] = useState('');
  const [previewCoords, setPreviewCoords] = useState<{lat: number, lng: number} | null>(null);
  const [coordInput, setCoordInput] = useState('');

  useEffect(() => {
    if (isEditingPoint) {
      setEditPointName(point.name);
      if (point.lat && point.lng) {
        setCoordInput(`${point.lat}, ${point.lng}`);
        setPreviewCoords({ lat: point.lat, lng: point.lng });
      } else {
        setCoordInput('');
        setPreviewCoords(null);
      }
    }
  }, [isEditingPoint, point]);

  const handleSaveReport = async () => {
    if (!selectedCat) return;

    setIsSaving(true);
    try {
      const fullReport: Report = {
        catId: selectedCat.id,
        fed: reportForm.fed || false,
        watered: isWatered,
        condition: reportForm.condition || 'good',
        notes: reportForm.notes || '',
        urgentDetail: reportForm.urgentDetail,
        urgentPhoto: reportForm.urgentPhoto,
        attentionDetail: reportForm.attentionDetail,
        timestamp: Date.now()
      };

      await dataStorage.saveReport(fullReport);

      const updatedCat = { ...selectedCat };
      if (reportForm.fed) {
        updatedCat.lastFed = new Date().toISOString();
      }
      if (reportForm.condition === 'injured') {
        updatedCat.status = 'injured';
      } else if (reportForm.condition === 'bad') {
        updatedCat.status = 'sick';
      } else if (reportForm.condition === 'good') {
        updatedCat.status = 'healthy';
      }
      
      await onUpdateCat(updatedCat);

      setSubmitted(true);
      setTimeout(() => {
          setSubmitted(false);
          setSelectedCat(null);
          setReportForm({
            fed: false,
            watered: false,
            condition: 'good',
            notes: '',
            urgentDetail: '',
            urgentPhoto: '',
            attentionDetail: ''
          });
      }, 1500);
    } catch (e) {
      alert("保存に失敗しました。通信環境を確認してください。");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = () => {
    if (selectedCat && currentUser.role === 'admin') {
      setEditData({ ...selectedCat });
      setIsEditing(true);
      setIsAddingNewCat(false);
    }
  };

  const startAdding = () => {
    if (currentUser.role === 'admin') {
      const newCat: Cat = {
        id: `cat-${Date.now()}`,
        name: '',
        features: '',
        imageUrl: 'https://placehold.co/400x400?text=No+Image',
        zoneId: point.zoneId,
        pointId: point.id,
        subPointIds: [],
        status: 'healthy'
      };
      setEditData(newCat);
      setSelectedCat(newCat);
      setIsEditing(true);
      setIsAddingNewCat(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    if (isAddingNewCat) setSelectedCat(null);
    setIsAddingNewCat(false);
  };

  const handleUrgentPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setReportForm({ ...reportForm, urgentPhoto: compressed });
      } catch (e) {}
    }
  };

  const handleSavePoint = async () => {
    if (onUpdatePoint && currentUser.role === 'admin') {
      setIsSaving(true);
      try {
        await onUpdatePoint({
          ...point,
          name: editPointName,
          lat: previewCoords?.lat || point.lat,
          lng: previewCoords?.lng || point.lng
        });
        setIsEditingPoint(false);
      } catch (e) {
        alert("拠点情報の保存に失敗しました。");
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (selectedCat) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pb-20">
        <div className="max-w-4xl mx-auto w-full bg-white shadow-xl min-h-screen relative">
          {/* Header & Photo Section (Only shown when NOT editing) */}
          {!isEditing && (
            <div className="relative h-72 md:h-96 w-full bg-gray-200 group">
              <img src={selectedCat.imageUrl} alt={selectedCat.name} className="w-full h-full object-cover" />
              <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-20">
                <div className="flex gap-2">
                  <button onClick={() => setSelectedCat(null)} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors">
                    <ArrowLeft size={20} />
                  </button>
                  <button onClick={onHome} className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"><Home size={20} /></button>
                </div>
                {currentUser.role === 'admin' && <button onClick={startEditing} className="p-2 bg-white/90 rounded-full text-gray-700 shadow-sm"><Pencil size={20} /></button>}
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 p-6 pt-20">
                <h2 className="text-3xl font-bold text-white mb-1">{selectedCat.name}</h2>
                <div className="flex flex-wrap gap-2 text-white/90 text-sm">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">{selectedCat.features}</span>
                </div>
              </div>
            </div>
          )}

          <div className={`p-6 ${!isEditing ? '-mt-6 rounded-t-3xl' : ''} bg-[#fdfbf7] relative z-10 min-h-[50vh]`}>
            <div className="max-w-2xl mx-auto">
              {isEditing && editData ? (
                <CatEditor
                  cat={editData}
                  isNew={isAddingNewCat}
                  points={points}
                  currentUser={currentUser}
                  onCancel={cancelEditing}
                  onSave={async (cat) => {
                    if (isAddingNewCat) {
                      await onAddCat(cat);
                    } else {
                      await onUpdateCat(cat);
                    }
                    setSelectedCat(cat);
                    setIsEditing(false);
                    setIsAddingNewCat(false);
                  }}
                />
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2 border-orange-100">本日のステータス報告</h3>
                  <div className="bg-white p-5 rounded-xl border border-gray-100">
                    <label className="block text-gray-500 text-sm font-bold mb-3">餌やり状況</label>
                    <button onClick={() => setReportForm({...reportForm, fed: !reportForm.fed})} className={`w-full py-3 rounded-lg border-2 font-bold ${reportForm.fed ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-400'}`}>給餌完了</button>
                  </div>
                  <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                    <label className="block text-red-600 text-sm font-bold mb-3 flex items-center gap-2"><AlertCircle size={18} />【要報告】</label>
                    <div className="space-y-3">
                      <div className="flex items-start gap-4">
                        <label className="cursor-pointer bg-white border text-red-600 p-3 rounded-lg flex flex-col items-center min-w-[80px]"><Camera size={24} /><span className="text-[10px] font-bold">写真</span><input type="file" accept="image/*" className="hidden" onChange={handleUrgentPhotoChange} /></label>
                        {reportForm.urgentPhoto && <img src={reportForm.urgentPhoto} className="h-20 w-20 rounded-lg object-cover" />}
                      </div>
                      <textarea className="w-full p-3 bg-white rounded-lg border text-sm" rows={2} placeholder="怪我の状況など..." value={reportForm.urgentDetail} onChange={(e) => setReportForm({...reportForm, urgentDetail: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={handleSaveReport} disabled={submitted || isSaving} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2">
                    {isSaving ? <Loader2 className="animate-spin" /> : null}
                    {submitted ? '保存しました' : 'ステータスを保存'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4">
      <div className="max-w-5xl mx-auto w-full">
        <div className="sticky top-0 bg-[#fdfbf7] z-10 py-4 mb-4 border-b border-orange-100 flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-orange-600"><ArrowLeft /></button>
          <button onClick={onHome} className="p-2 text-orange-600"><Home /></button>
          <h1 className="text-xl font-bold">{point.name}</h1>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 mb-6 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2"><Droplets size={16} className="text-blue-500" />拠点ステータス</h2>
          <button onClick={onToggleWater} className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${isWatered ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
            <span className="font-bold flex items-center gap-2"><Droplets size={20} />水やり</span>
            <div className={`flex items-center gap-2 font-bold ${isWatered ? 'text-blue-600' : 'text-gray-400'}`}>{isWatered ? <><span>完了済み</span><Check size={20} /></> : <span>未完了</span>}</div>
          </button>
        </div>
        {currentUser.role === 'admin' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 mb-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-600">拠点管理</h2>
              <button onClick={() => setIsEditingPoint(!isEditingPoint)} className="text-xs text-orange-500 font-bold">{isEditingPoint ? '閉じる' : '編集'}</button>
            </div>
            {isEditingPoint && (
              <div className="space-y-4">
                <input type="text" value={editPointName} onChange={(e) => setEditPointName(e.target.value)} className="w-full p-2 border rounded" placeholder="拠点名" />
                <button onClick={handleSavePoint} disabled={isSaving} className="w-full py-2 bg-orange-500 text-white rounded">
                  {isSaving ? "保存中..." : "保存"}
                </button>
              </div>
            )}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCats.map(cat => (
            <div key={cat.id} onClick={() => setSelectedCat(cat)} className="bg-white rounded-xl overflow-hidden border border-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
              <img src={cat.imageUrl} alt={cat.name} className="w-full aspect-square object-cover" />
              <div className="p-3"><p className="font-bold text-sm truncate">{cat.name}</p><p className="text-[10px] text-gray-400 mt-1 truncate">{cat.features}</p></div>
            </div>
          ))}
          {currentUser.role === 'admin' && (
            <button onClick={startAdding} className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center min-h-[150px] text-gray-400">
              <Plus size={32} /><span className="text-xs font-bold mt-2">追加</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};