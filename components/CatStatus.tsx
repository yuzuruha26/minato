
import React, { useState, useEffect } from 'react';
import { Cat, FeedingPoint, Report, User, Zone } from '../types';
import { ArrowLeft, Check, AlertTriangle, Heart, Save, Droplets, Pencil, X, Camera, ImagePlus, MapPin, Settings, Search, Map as MapIcon, Plus, Home, AlertCircle, FileWarning } from 'lucide-react';

// --- Feature Options Constants ---
const CAT_COLORS = ['黒', '白', '茶', 'グレー', 'クリーム', '赤', '銀', '不明'];
const CAT_PATTERNS = ['単色', 'キジトラ', '茶トラ', 'サバトラ', '三毛', 'サビ', 'ハチワレ', 'ブチ', 'ポイント', '縞模様', '不明'];
const CAT_FUR_TYPES = ['短毛', '長毛', '中毛', '不明'];
const CAT_TAIL_TYPES = ['長い', '短い', '中くらい', 'カギ', '団子', 'ボブテイル', 'なし', '不明'];

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
  // Filter cats that belong to this point (either as primary or sub)
  const filteredCats = cats.filter(c => c.pointId === point.id || c.subPointIds?.includes(point.id));
  const [selectedCat, setSelectedCat] = useState<Cat | null>(null);
  
  // Status Report State
  const [report, setReport] = useState<Partial<Report>>({
    fed: false,
    watered: false,
    condition: 'good',
    notes: '',
    urgentDetail: '',
    urgentPhoto: '',
    attentionDetail: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Editing State (Cats)
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [editData, setEditData] = useState<Cat | null>(null);

  // Priority Points State (4 slots)
  const [priorityPoints, setPriorityPoints] = useState<string[]>(['', '', '', '']);

  // Feature Breakdown State
  const [featureParts, setFeatureParts] = useState({
    color: '',
    pattern: '',
    fur: '',
    tail: '',
    other: ''
  });

  // Editing State (Point Info & Coordinates)
  const [isEditingPoint, setIsEditingPoint] = useState(false);
  const [coordInput, setCoordInput] = useState('');
  const [editPointName, setEditPointName] = useState('');
  const [previewCoords, setPreviewCoords] = useState<{lat: number, lng: number} | null>(null);
  const [coordError, setCoordError] = useState('');

  // Initialize input when editing starts
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

  // 画像圧縮ユーティリティ
  const resizeAndCompressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
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
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveReport = () => {
    // Save report logic
    setSubmitted(true);

    // Update Cat Timestamp in App State
    if (selectedCat && !isAddingNewCat) {
      const updatedCat = { ...selectedCat };
      
      // ONLY update lastFed if the user actually fed the cat
      if (report.fed) {
        updatedCat.lastFed = new Date().toISOString();
      }

      // Update cat status based on reported condition
      if (report.condition === 'injured') {
        updatedCat.status = 'injured';
      } else if (report.condition === 'bad') {
        updatedCat.status = 'sick';
      } else if (report.condition === 'good') {
        updatedCat.status = 'healthy';
      }
      
      onUpdateCat(updatedCat);
    }

    setTimeout(() => {
        setSubmitted(false);
        setSelectedCat(null); // Return to list
        // Reset report form
        setReport({
          fed: false,
          watered: false,
          condition: 'good',
          notes: '',
          urgentDetail: '',
          urgentPhoto: '',
          attentionDetail: ''
        });
    }, 1500);
  };

  // Helper to parse existing feature string into parts
  const parseFeatures = (text: string) => {
    let remaining = text;
    const found = { color: '', pattern: '', fur: '', tail: '' };

    const extract = (options: string[], key: keyof typeof found) => {
      for (const opt of options) {
        if (opt === '不明' || opt === 'その他') continue;
        if (remaining.includes(opt)) {
          found[key] = opt;
          remaining = remaining.replace(opt, '').trim();
          // Remove punctuation left behind
          remaining = remaining.replace(/^[,、\s/]+|[,、\s/]+$/g, '');
          break; // Assume one per category
        }
      }
    };

    extract(CAT_PATTERNS, 'pattern'); // Pattern often contains color names (e.g. 茶トラ), so check first or accept overlap? Ideally check pattern first.
    extract(CAT_COLORS, 'color');
    extract(CAT_FUR_TYPES, 'fur');
    extract(CAT_TAIL_TYPES, 'tail');

    return { ...found, other: remaining };
  };

  const startEditing = () => {
    if (selectedCat && currentUser.role === 'admin') {
      setEditData({ ...selectedCat });
      
      // Init priority points
      const subs = selectedCat.subPointIds || [];
      setPriorityPoints([
        selectedCat.pointId, 
        subs[0] || '', 
        subs[1] || '', 
        subs[2] || ''
      ]);

      // Parse features
      const parts = parseFeatures(selectedCat.features);
      setFeatureParts(parts);

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
        imageUrl: 'https://placehold.co/400x400?text=No+Image', // Placeholder
        zoneId: point.zoneId,
        pointId: point.id, // Default to current point
        subPointIds: [],
        status: 'healthy'
      };
      setEditData(newCat);
      setPriorityPoints([point.id, '', '', '']); // Default to current point as primary
      setFeatureParts({ color: '', pattern: '', fur: '', tail: '', other: '' }); // Reset parts
      setSelectedCat(newCat); // Set as selected to show the modal
      setIsEditing(true);
      setIsAddingNewCat(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData(null);
    if (isAddingNewCat) {
      setSelectedCat(null);
    }
    setIsAddingNewCat(false);
  };

  const saveEditing = () => {
    if (editData && currentUser.role === 'admin') {
      // Reconstruct features string
      const parts = [
        featureParts.color,
        featureParts.pattern,
        featureParts.fur,
        featureParts.tail !== '' && !featureParts.tail.includes('尻尾') ? featureParts.tail + '尻尾' : featureParts.tail
      ].filter(p => p && p !== '不明'); // Filter out empty or 'unknown' selections

      // Add 'other' text
      if (featureParts.other) parts.push(featureParts.other);

      // Join with spaces or commas? Spaces are cleaner for tags.
      const newFeatures = parts.join(' ');

      // Reconstruct Points
      const [p1, p2, p3, p4] = priorityPoints;
      // Ensure primary point is valid (fallback to current if empty, though UI should prevent)
      const primaryPointId = p1 || point.id;
      // Filter out empty subs
      const subPointIds = [p2, p3, p4].filter(id => id && id !== '');
      
      // Find zone for primary point to update zoneId
      const primaryPointObj = points.find(p => p.id === primaryPointId);
      const newZoneId = primaryPointObj ? primaryPointObj.zoneId : editData.zoneId;

      const catToSave = { 
        ...editData, 
        features: newFeatures,
        pointId: primaryPointId,
        subPointIds: subPointIds,
        zoneId: newZoneId
      };

      if (isAddingNewCat) {
        onAddCat(catToSave);
      } else {
        onUpdateCat(catToSave);
      }
      setSelectedCat(catToSave); // Update current view
      setIsEditing(false);
      setEditData(null);
      setIsAddingNewCat(false);
    }
  };

  const handlePriorityPointChange = (index: number, value: string) => {
    const newPriorities = [...priorityPoints];
    newPriorities[index] = value;
    
    // Auto-clear logic: If we select a value that matches another slot, clear the other slot
    if (value !== '') {
        for (let i = 0; i < 4; i++) {
            if (i !== index && newPriorities[i] === value) {
                newPriorities[i] = '';
            }
        }
    }
    setPriorityPoints(newPriorities);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editData) {
      try {
        const compressed = await resizeAndCompressImage(file);
        setEditData({ ...editData, imageUrl: compressed });
      } catch (e) {
        console.error("Image processing error", e);
      }
    }
  };

  const handleUrgentPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await resizeAndCompressImage(file);
        setReport({ ...report, urgentPhoto: compressed });
      } catch (e) {
        console.error("Image processing error", e);
      }
    }
  };

  // --- Coordinate Parsing Logic ---
  const parseCoordinates = (input: string) => {
    setCoordError('');
    const trimmed = input.trim();
    if (!trimmed) {
      // Allow empty coordinates if just renaming
      setPreviewCoords(null);
      return;
    }

    // 1. Try DMS Format (e.g., 31°54'17.2"N 131°27'52.0"E)
    const dmsRegex = /(\d+)°(\d+)'([\d.]+)"([NSEW])/gi;
    const matches = [...trimmed.matchAll(dmsRegex)];

    if (matches.length >= 2) {
      try {
        const parseDMS = (m: RegExpMatchArray) => {
          const deg = parseFloat(m[1]);
          const min = parseFloat(m[2]);
          const sec = parseFloat(m[3]);
          const dir = m[4].toUpperCase();
          let val = deg + min / 60 + sec / 3600;
          if (dir === 'S' || dir === 'W') val *= -1;
          return val;
        };

        const coords = matches.map(parseDMS);
        const lat = coords[0];
        const lng = coords[1];

        setPreviewCoords({ lat, lng });
        return;
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Try Standard Decimal Format
    const parts = trimmed.split(/[,/\s\u3000]+/).filter(p => p !== '');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        setPreviewCoords({ lat, lng });
        return;
      }
    }

    setCoordError('座標を認識できませんでした。形式を確認してください。\n例: 31°54\'17.2"N 131°27\'52.0"E または 31.904, 131.464');
    setPreviewCoords(null);
  };

  const handleSavePoint = () => {
    if (onUpdatePoint && currentUser.role === 'admin') {
      onUpdatePoint({
        ...point,
        name: editPointName,
        lat: previewCoords?.lat || point.lat,
        lng: previewCoords?.lng || point.lng
      });
      setIsEditingPoint(false);
    }
  };

  // If a cat is selected (View or Edit mode)
  if (selectedCat) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] pb-20">
        <div className="max-w-4xl mx-auto w-full bg-white shadow-xl min-h-screen relative">
          {/* Cover Photo Area with Edit Mode Support */}
          <div className="relative h-72 md:h-96 w-full bg-gray-200 group">
            <img 
              src={isEditing && editData ? editData.imageUrl : selectedCat.imageUrl} 
              alt={selectedCat.name} 
              className="w-full h-full object-cover transition-opacity" 
            />
            
            {/* Navigation / Actions */}
            <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-20">
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if(isEditing) cancelEditing();
                    else setSelectedCat(null);
                  }}
                  className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
                >
                  {isEditing ? <X size={20} /> : <ArrowLeft size={20} />}
                </button>
                {!isEditing && (
                  <button 
                    onClick={onHome}
                    className="p-2 bg-black/30 backdrop-blur-md rounded-full text-white hover:bg-black/50 transition-colors"
                  >
                    <Home size={20} />
                  </button>
                )}
              </div>

              {/* Edit Button - Only for Admin */}
              {!isEditing && currentUser.role === 'admin' && (
                <button 
                  onClick={startEditing}
                  className="p-2 bg-white/90 backdrop-blur-md rounded-full text-gray-700 hover:bg-white transition-colors shadow-sm"
                >
                  <Pencil size={20} />
                </button>
              )}
              
              {isEditing && (
                <button 
                onClick={saveEditing}
                className="px-4 py-2 bg-orange-500 rounded-full text-white font-bold hover:bg-orange-600 transition-colors shadow-sm text-sm"
              >
                保存
              </button>
              )}
            </div>

            {/* Photo Edit Overlay */}
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                <label className="cursor-pointer flex flex-col items-center gap-2 text-white p-4 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                    <ImagePlus size={32} />
                  </div>
                  <span className="font-bold text-sm">写真を変更</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                </label>
              </div>
            )}

            {/* Title Area (Read Mode) */}
            {!isEditing && (
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20">
                <h2 className="text-3xl font-bold text-white mb-1">{selectedCat.name}</h2>
                <div className="flex flex-wrap gap-2 text-white/90 text-sm">
                  <span className="bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">{selectedCat.features}</span>
                  {/* Show secondary points in View mode if any */}
                  {selectedCat.subPointIds && selectedCat.subPointIds.length > 0 && (
                     <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        <MapIcon size={12} /> 他{selectedCat.subPointIds.length}箇所
                     </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 -mt-6 rounded-t-3xl bg-[#fdfbf7] relative z-10 min-h-[50vh]">
            <div className="max-w-2xl mx-auto">
              
              {isEditing && editData ? (
                /* --- EDIT FORM (Admin Only) --- */
                <div className="space-y-5 animate-fade-in-up">
                  <div className="bg-white p-5 rounded-xl shadow-sm border border-orange-200">
                    <h3 className="text-sm font-bold text-orange-600 mb-4 flex items-center gap-2">
                      {isAddingNewCat ? <Plus size={16} /> : <Pencil size={16} />} 
                      {isAddingNewCat ? '新規ネコ登録' : '基本情報の編集'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-500 text-xs font-bold mb-1">名前</label>
                        <input 
                          type="text" 
                          value={editData.name}
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          placeholder="例: タマ (3号)"
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 font-bold text-lg"
                        />
                      </div>

                      {/* --- Priority Points Selection --- */}
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                         <h4 className="text-xs font-bold text-gray-500 mb-2 border-b border-blue-200 pb-1">担当スポット (優先度順)</h4>
                         
                         {[0, 1, 2, 3].map((index) => {
                             // Filter options: exclude items selected in HIGHER priority (lower index)
                             const higherPrioritySelections = priorityPoints.filter((_, i) => i < index);
                             
                             return (
                               <div key={index}>
                                 <label className="block text-[10px] text-gray-500 font-bold mb-1">
                                    {index === 0 ? '優先度1 (メインスポット)' : `優先度${index + 1}`}
                                 </label>
                                 <select 
                                   value={priorityPoints[index]} 
                                   onChange={(e) => handlePriorityPointChange(index, e.target.value)}
                                   className={`w-full p-2 bg-white border rounded-lg text-sm ${index === 0 ? 'border-orange-300 font-bold text-gray-800' : 'border-gray-200 text-gray-600'}`}
                                 >
                                   <option value="">{index === 0 ? '選択必須' : '---'}</option>
                                   {zones.map(z => {
                                      const zonePoints = points.filter(p => p.zoneId === z.id);
                                      if(zonePoints.length === 0) return null;
                                      return (
                                        <optgroup key={z.id} label={z.name}>
                                           {zonePoints.map(p => {
                                             // Disable if selected in higher priority
                                             const isDisabled = higherPrioritySelections.includes(p.id);
                                             if (isDisabled) return null; 
                                             return (
                                                <option key={p.id} value={p.id}>{z.name} {p.name}</option>
                                             );
                                           })}
                                        </optgroup>
                                      );
                                   })}
                                 </select>
                               </div>
                             );
                         })}
                      </div>

                      {/* Split Feature Selection */}
                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 space-y-3">
                         <h4 className="text-xs font-bold text-gray-500 mb-2 border-b border-orange-200 pb-1">特徴（選択式）</h4>
                         
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                               <label className="block text-[10px] text-gray-500 font-bold mb-1">色</label>
                               <select 
                                 value={featureParts.color} 
                                 onChange={(e) => setFeatureParts({...featureParts, color: e.target.value})}
                                 className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                               >
                                 <option value="">未選択</option>
                                 {CAT_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-[10px] text-gray-500 font-bold mb-1">柄</label>
                               <select 
                                 value={featureParts.pattern} 
                                 onChange={(e) => setFeatureParts({...featureParts, pattern: e.target.value})}
                                 className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                               >
                                 <option value="">未選択</option>
                                 {CAT_PATTERNS.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-[10px] text-gray-500 font-bold mb-1">種類</label>
                               <select 
                                 value={featureParts.fur} 
                                 onChange={(e) => setFeatureParts({...featureParts, fur: e.target.value})}
                                 className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                               >
                                 <option value="">未選択</option>
                                 {CAT_FUR_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="block text-[10px] text-gray-500 font-bold mb-1">尻尾</label>
                               <select 
                                 value={featureParts.tail} 
                                 onChange={(e) => setFeatureParts({...featureParts, tail: e.target.value})}
                                 className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm"
                               >
                                 <option value="">未選択</option>
                                 {CAT_TAIL_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                               </select>
                            </div>
                         </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 text-xs font-bold mb-1">その他・詳細特徴</label>
                        <textarea 
                          value={featureParts.other}
                          onChange={(e) => setFeatureParts({...featureParts, other: e.target.value})}
                          placeholder="例: 耳カット右、目の色がグリーン..."
                          className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 text-sm h-20"
                        />
                      </div>

                      <div>
                        <label className="block text-gray-500 text-xs font-bold mb-2">基本ステータス</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['healthy', 'injured', 'sick', 'unknown'] as const).map(status => (
                            <button
                              key={status}
                              onClick={() => setEditData({...editData, status})}
                              className={`py-2 px-3 rounded-lg text-sm border-2 transition-all ${
                                editData.status === status 
                                  ? 'border-orange-500 bg-orange-50 text-orange-700 font-bold' 
                                  : 'border-gray-100 text-gray-500'
                              }`}
                            >
                              {status === 'healthy' ? '健康' : 
                                status === 'injured' ? '怪我' : 
                                status === 'sick' ? '病気' : '不明/その他'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={saveEditing}
                    className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl"
                  >
                    {isAddingNewCat ? '登録する' : '編集内容を保存'}
                  </button>
                </div>

              ) : (
                /* --- REPORT FORM (Accessible to All) --- */
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 border-orange-100">本日のステータス報告</h3>
                  
                  <div className="space-y-6">
                    {/* Feeding Status */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <label className="block text-gray-500 text-sm font-bold mb-3">餌やり状況</label>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setReport({...report, fed: !report.fed})}
                          className={`flex-1 py-3 px-4 rounded-lg border-2 font-bold flex items-center justify-center gap-2 transition-all ${
                            report.fed ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-400 hover:border-gray-300'
                          }`}
                        >
                          {report.fed && <Check size={18} />} 餌やり完了
                        </button>
                      </div>
                    </div>

                    {/* Health Condition */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <label className="block text-gray-500 text-sm font-bold mb-3">体調・健康状態</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { id: 'good', label: '元気', icon: <Heart className="text-pink-500" /> },
                          { id: 'bad', label: '不調', icon: <AlertTriangle className="text-yellow-500" /> },
                          { id: 'injured', label: '怪我', icon: <div className="text-red-500 font-bold text-lg">!</div> },
                        ].map((status) => (
                          <button
                            key={status.id}
                            onClick={() => setReport({...report, condition: status.id as any})}
                            className={`flex flex-col items-center justify-center py-4 rounded-lg border-2 transition-all ${
                              report.condition === status.id 
                                ? 'border-gray-800 bg-gray-800 text-white' 
                                : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <div className="mb-1">{status.icon}</div>
                            <span className="text-xs font-bold">{status.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Urgent Report Section (NEW) */}
                    <div className="bg-red-50 p-5 rounded-xl shadow-sm border border-red-200">
                      <label className="block text-red-600 text-sm font-bold mb-3 flex items-center gap-2">
                        <AlertCircle size={18} className="fill-red-100 text-red-600" />
                        【要報告】
                      </label>
                      
                      <div className="space-y-3">
                        {/* Photo Upload */}
                        <div className="flex items-start gap-4">
                          <label className="cursor-pointer bg-white border border-red-200 text-red-600 hover:bg-red-100 p-3 rounded-lg flex flex-col items-center justify-center gap-1 min-w-[80px] transition-colors">
                            <Camera size={24} />
                            <span className="text-[10px] font-bold">写真追加</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleUrgentPhotoChange} />
                          </label>
                          
                          {report.urgentPhoto ? (
                            <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-red-200">
                              <img src={report.urgentPhoto} alt="Urgent" className="w-full h-full object-cover" />
                              <button 
                                onClick={() => setReport({...report, urgentPhoto: ''})}
                                className="absolute top-0 right-0 bg-red-600 text-white p-0.5"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="text-xs text-red-400 py-2">
                              怪我や異常が見られる場合は<br/>写真を添付してください。
                            </div>
                          )}
                        </div>

                        <textarea 
                          className="w-full p-3 bg-white rounded-lg border border-red-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200"
                          rows={2}
                          placeholder="緊急性の高い内容を入力..."
                          value={report.urgentDetail}
                          onChange={(e) => setReport({...report, urgentDetail: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Attention Section (NEW) */}
                    <div className="bg-yellow-50 p-5 rounded-xl shadow-sm border border-yellow-200">
                      <label className="block text-yellow-700 text-sm font-bold mb-3 flex items-center gap-2">
                        <FileWarning size={18} className="text-yellow-600" />
                        【注意】
                      </label>
                      <textarea 
                        className="w-full p-3 bg-white rounded-lg border border-yellow-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                        rows={2}
                        placeholder="気になった点を入力してください"
                        value={report.attentionDetail}
                        onChange={(e) => setReport({...report, attentionDetail: e.target.value})}
                      />
                    </div>

                    {/* Notes (Existing) */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                      <label className="block text-gray-500 text-sm font-bold mb-2">その他報告</label>
                      <textarea 
                        className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-200"
                        rows={3}
                        placeholder="特記事項があれば入力..."
                        value={report.notes}
                        onChange={(e) => setReport({...report, notes: e.target.value})}
                      />
                    </div>

                    <button 
                      onClick={handleSaveReport}
                      disabled={submitted}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                      {submitted ? (
                        <>
                          <Check /> 記録しました
                        </>
                      ) : (
                        <>
                          <Save /> ステータスを保存
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4">
      <div className="max-w-5xl mx-auto w-full">
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
            <h1 className="text-xl font-bold text-gray-800">{point.name}</h1>
            <p className="text-xs text-gray-500">登録されているネコ一覧 ({filteredCats.length}匹)</p>
          </div>
        </div>

        {/* Point Level Management */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 mb-6 max-w-2xl mx-auto">
          <h2 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" />
            拠点ステータス
          </h2>
          <button 
            onClick={onToggleWater}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              isWatered 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'
            }`}
          >
            <span className="font-bold flex items-center gap-2">
              <Droplets size={20} className={isWatered ? 'fill-blue-600' : ''} />
              水やり
            </span>
            <div className={`flex items-center gap-2 font-bold ${isWatered ? 'text-blue-600' : 'text-gray-400'}`}>
              {isWatered ? (
                <>
                  <span>完了済み</span>
                  <Check size={20} />
                </>
              ) : (
                <span>未完了</span>
              )}
            </div>
          </button>
        </div>
        
        {/* Admin: Coordinates & Info Management */}
        {currentUser.role === 'admin' && onUpdatePoint && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-200 mb-6 max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-600 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" />
                管理者設定 (拠点情報)
              </h2>
              <button 
                onClick={() => setIsEditingPoint(!isEditingPoint)}
                className="text-xs text-orange-500 font-bold hover:underline"
              >
                {isEditingPoint ? 'キャンセル' : '編集'}
              </button>
            </div>

            {isEditingPoint ? (
              <div className="space-y-4 animate-fade-in-up">
                {/* Point Name Edit */}
                <div>
                  <label className="block text-xs text-gray-500 font-bold mb-1">
                    拠点名 (スポット名)
                  </label>
                  <input 
                    type="text"
                    value={editPointName}
                    onChange={(e) => setEditPointName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 font-bold text-gray-800"
                  />
                </div>

                {/* Coordinates Edit */}
                <div>
                  <label className="block text-xs text-gray-500 font-bold mb-1">
                    座標情報 (DMS形式または10進数)
                  </label>
                  <div className="relative">
                    <textarea 
                      value={coordInput}
                      onChange={(e) => setCoordInput(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-400 h-24"
                      placeholder={`例:\n31°54'17.2"N 131°27'52.0"E\nまたは\n31.904, 131.464`}
                    />
                    <button 
                      onClick={() => parseCoordinates(coordInput)}
                      className="absolute bottom-2 right-2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full font-bold flex items-center gap-1 hover:bg-gray-700"
                    >
                      <Search size={12} />
                      地図で確認
                    </button>
                  </div>
                  {coordError && (
                    <p className="text-red-500 text-xs mt-1 font-bold whitespace-pre-wrap">{coordError}</p>
                  )}
                </div>

                {/* Map Preview */}
                {previewCoords && (
                  <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-600 mb-1">
                      <MapIcon size={14} className="text-orange-500" />
                      <span>位置プレビュー ({previewCoords.lat.toFixed(5)}, {previewCoords.lng.toFixed(5)})</span>
                    </div>
                    <div className="w-full h-40 bg-gray-200 rounded-lg overflow-hidden border border-gray-300 relative">
                      <iframe 
                          title="Coordinate Preview"
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          src={`https://maps.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&z=16&output=embed`}
                          className="w-full h-full"
                        ></iframe>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={handleSavePoint}
                  className="w-full py-3 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 shadow-sm mt-2"
                >
                  情報を更新して保存
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <MapPin size={12} />
                  {point.lat && point.lng ? (
                    <span className="font-mono">{point.lat.toFixed(6)}, {point.lng.toFixed(6)}</span>
                  ) : (
                    <span>座標未設定</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <h2 className="text-sm font-bold text-gray-600 mb-3 ml-1">ネコ一覧</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredCats.map(cat => (
            <div 
              key={cat.id} 
              onClick={() => setSelectedCat(cat)}
              className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer group"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={cat.imageUrl} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white font-bold text-sm truncate">{cat.name}</p>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${cat.status === 'healthy' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-xs text-gray-500">{cat.status === 'healthy' ? '健康' : '要観察'}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-1">{cat.features}</p>
              </div>
            </div>
          ))}
          
          {/* Add New Cat Button (Admin Only) */}
          {currentUser.role === 'admin' && (
            <button 
              onClick={startAdding}
              className="bg-gray-50 rounded-xl overflow-hidden border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer flex flex-col items-center justify-center h-full min-h-[160px] text-gray-400 hover:text-orange-500 group"
            >
              <div className="p-3 bg-white rounded-full shadow-sm mb-2 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <span className="text-xs font-bold">ネコを追加</span>
            </button>
          )}
          
          {/* Empty State */}
          {filteredCats.length === 0 && currentUser.role !== 'admin' && (
            <div className="col-span-2 md:col-span-4 text-center py-10 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p>このポイントにはまだネコが登録されていません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};