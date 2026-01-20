
import React, { useState, useEffect } from 'react';
import { Cat, FeedingPoint, Zone, Member } from '../types';
import { storage } from '../services/storage';
import { 
  Search, MapPin, Map, Cat as CatIcon, X, Save, 
  Plus, Pencil, Settings, ChevronRight, CheckCircle, AlertCircle, Users, Smartphone, Clock, Calendar, MessageCircle, Database
} from 'lucide-react';

// Feature Constants (Synced with CatStatus)
const CAT_COLORS = ['黒', '白', '茶', 'グレー', 'クリーム', '赤', '銀', '不明'];
const CAT_PATTERNS = ['単色', 'キジトラ', '茶トラ', 'サバトラ', '三毛', 'サビ', 'ハチワレ', 'ブチ', 'ポイント', '縞模様', '不明'];
const CAT_FUR_TYPES = ['短毛', '長毛', '中毛', '不明'];
const CAT_TAIL_TYPES = ['長い', '短い', '中くらい', 'カギ', '団子', 'ボブテイル', 'なし', '不明'];

interface AdminDashboardProps {
  cats: Cat[];
  points: FeedingPoint[];
  zones: Zone[];
  members: Member[];
  onUpdateCat: (cat: Cat) => void;
  onAddCat: (cat: Cat) => void;
  onUpdatePoint: (point: FeedingPoint) => void;
  onAddPoint: (point: FeedingPoint) => void;
  onUpdateZone: (zone: Zone) => void;
  onAddZone: (zone: Zone) => void;
  onUpdateMember: (member: Member) => void;
  onAddMember: (member: Member) => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  cats, points, zones, members,
  onUpdateCat, onAddCat,
  onUpdatePoint, onAddPoint,
  onUpdateZone, onAddZone,
  onUpdateMember, onAddMember,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'cats' | 'points' | 'zones' | 'members'>('zones');
  const [searchTerm, setSearchTerm] = useState('');
  
  // -- Edit States --
  const [editingCat, setEditingCat] = useState<Cat | null>(null);
  const [editingPoint, setEditingPoint] = useState<FeedingPoint | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  
  // -- Priority Points State for Cat Editing --
  const [catPriorityPoints, setCatPriorityPoints] = useState<string[]>(['', '', '', '']);

  // -- Feature Parts State for Cat Editing --
  const [featureParts, setFeatureParts] = useState({
    color: '',
    pattern: '',
    fur: '',
    tail: '',
    other: ''
  });

  // -- Coordinate Input State for Point Editing --
  const [coordInput, setCoordInput] = useState('');
  const [coordError, setCoordError] = useState('');

  // --- Filtering Logic ---
  const filteredCats = cats.filter(cat => 
    cat.name.includes(searchTerm) || cat.features.includes(searchTerm)
  );

  const filteredPoints = points.filter(point => 
    point.name.includes(searchTerm) || 
    zones.find(z => z.id === point.zoneId)?.name.includes(searchTerm)
  );

  const filteredMembers = members.filter(member => 
    member.name.includes(searchTerm) || member.contactMethod.includes(searchTerm)
  );

  // --- Helpers ---
  const getZoneName = (zoneId: string) => zones.find(z => z.id === zoneId)?.name || '不明';
  const getPointName = (pointId: string) => points.find(p => p.id === pointId)?.name || '不明';

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  // --- Feature Parser ---
  const parseFeatures = (text: string) => {
    let remaining = text;
    const found = { color: '', pattern: '', fur: '', tail: '' };

    const extract = (options: string[], key: keyof typeof found) => {
      for (const opt of options) {
        if (opt === '不明' || opt === 'その他') continue;
        if (remaining.includes(opt)) {
          found[key] = opt;
          remaining = remaining.replace(opt, '').trim();
          remaining = remaining.replace(/^[,、\s/]+|[,、\s/]+$/g, '');
          break;
        }
      }
    };

    extract(CAT_PATTERNS, 'pattern');
    extract(CAT_COLORS, 'color');
    extract(CAT_FUR_TYPES, 'fur');
    extract(CAT_TAIL_TYPES, 'tail');

    return { ...found, other: remaining };
  };

  // --- Coordinate Parser (Reused logic) ---
  const parseCoordinates = (input: string) => {
    setCoordError('');
    const trimmed = input.trim();
    if (!trimmed) return null;

    // DMS Format
    const dmsRegex = /(\d+)°(\d+)'([\d.]+)"([NSEW])/gi;
    const matches = [...trimmed.matchAll(dmsRegex)];
    if (matches.length >= 2) {
      try {
        const parseDMS = (m: RegExpMatchArray) => {
          let val = parseFloat(m[1]) + parseFloat(m[2]) / 60 + parseFloat(m[3]) / 3600;
          if (m[4].toUpperCase() === 'S' || m[4].toUpperCase() === 'W') val *= -1;
          return val;
        };
        return { lat: parseDMS(matches[0]), lng: parseDMS(matches[1]) };
      } catch (e) { console.error(e); }
    }

    // Decimal Format
    const parts = trimmed.split(/[,/\s\u3000]+/).filter(p => p !== '');
    if (parts.length >= 2) {
      const lat = parseFloat(parts[0]);
      const lng = parseFloat(parts[1]);
      if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
    }

    setCoordError('座標形式が無効です');
    return null;
  };

  // --- Handlers ---

  const handleForceSeed = async () => {
    if (window.confirm("警告: クラウド上の現在のデータが初期デモデータで上書きされる可能性があります。\n\n実行しますか？")) {
      await storage.seedDatabase(true);
      window.location.reload();
    }
  };

  const handleSaveCat = () => {
    if (!editingCat) return;

    // Reconstruct Points
    const [p1, p2, p3, p4] = catPriorityPoints;
    const primaryPointId = p1;
    const subPointIds = [p2, p3, p4].filter(id => id && id !== '');

    if (!primaryPointId) {
        alert("メインスポット（優先度1）は必須です。");
        return;
    }

    // Determine Zone ID based on primary point
    const primaryPointObj = points.find(p => p.id === primaryPointId);
    const newZoneId = primaryPointObj ? primaryPointObj.zoneId : editingCat.zoneId;

    // Reconstruct Features String
    const parts = [
      featureParts.color,
      featureParts.pattern,
      featureParts.fur,
      featureParts.tail !== '' && !featureParts.tail.includes('尻尾') ? featureParts.tail + '尻尾' : featureParts.tail
    ].filter(p => p && p !== '不明');

    if (featureParts.other) parts.push(featureParts.other);
    const newFeatures = parts.join(' ');

    const catToSave = {
        ...editingCat,
        pointId: primaryPointId,
        subPointIds: subPointIds,
        zoneId: newZoneId,
        features: newFeatures
    };

    const exists = cats.find(c => c.id === editingCat.id);
    if (exists) {
      onUpdateCat(catToSave);
    } else {
      onAddCat(catToSave);
    }
    setEditingCat(null);
  };

  const handleSavePoint = () => {
    if (!editingPoint) return;
    
    let lat = editingPoint.lat;
    let lng = editingPoint.lng;

    if (coordInput) {
      const coords = parseCoordinates(coordInput);
      if (coords) {
        lat = coords.lat;
        lng = coords.lng;
      } else if (coordInput.trim() !== '') {
        return; 
      }
    }

    const pointToSave = { ...editingPoint, lat, lng };
    const exists = points.find(p => p.id === editingPoint.id);
    
    if (exists) {
      onUpdatePoint(pointToSave);
    } else {
      onAddPoint(pointToSave);
    }
    setEditingPoint(null);
  };

  const handleSaveZone = () => {
    if (!editingZone) return;
    const exists = zones.find(z => z.id === editingZone.id);
    if (exists) {
      onUpdateZone(editingZone);
    } else {
      onAddZone(editingZone);
    }
    setEditingZone(null);
  };

  const handleSaveMember = () => {
    if (!editingMember) return;
    const exists = members.find(m => m.id === editingMember.id);
    if (exists) {
      onUpdateMember(editingMember);
    } else {
      onAddMember(editingMember);
    }
    setEditingMember(null);
  };

  const startAddCat = () => {
    const newCat: Cat = {
      id: `cat-${Date.now()}`,
      name: '',
      features: '',
      imageUrl: 'https://placehold.co/400x400?text=No+Image',
      zoneId: zones[0]?.id || '',
      pointId: points[0]?.id || '',
      subPointIds: [],
      status: 'healthy'
    };
    setEditingCat(newCat);
    setCatPriorityPoints([newCat.pointId, '', '', '']);
    setFeatureParts({ color: '', pattern: '', fur: '', tail: '', other: '' });
  };

  const startEditCat = (cat: Cat) => {
      setEditingCat({...cat});
      const subs = cat.subPointIds || [];
      setCatPriorityPoints([
          cat.pointId,
          subs[0] || '',
          subs[1] || '',
          subs[2] || ''
      ]);
      setFeatureParts(parseFeatures(cat.features));
  };

  const startAddPoint = () => {
    setEditingPoint({
      id: `point-${Date.now()}`,
      name: '',
      zoneId: zones[0]?.id || ''
    });
    setCoordInput('');
  };

  const startAddMember = () => {
    setEditingMember({
      id: `user-${Date.now()}`,
      name: '',
      role: 'general',
      phoneModel: '',
      availableHours: '',
      membershipExpiry: new Date().toISOString().split('T')[0],
      contactMethod: ''
    });
  };

  const startEditPoint = (point: FeedingPoint) => {
    setEditingPoint({ ...point });
    setCoordInput(point.lat && point.lng ? `${point.lat}, ${point.lng}` : '');
  };

  const handlePriorityPointChange = (index: number, value: string) => {
    const newPriorities = [...catPriorityPoints];
    newPriorities[index] = value;
    
    // Auto-clear logic: If we select a value that matches another slot, clear the other slot
    if (value !== '') {
        for (let i = 0; i < 4; i++) {
            if (i !== index && newPriorities[i] === value) {
                newPriorities[i] = '';
            }
        }
    }
    setCatPriorityPoints(newPriorities);
  };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <Settings className="text-orange-400" />
          <h1 className="text-xl font-bold">管理ダッシュボード</h1>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleForceSeed}
            className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
            title="クラウド上のデータを初期データでリセット"
          >
            <Database size={16} /> デモデータ復元
          </button>
          <button 
            onClick={onClose} 
            className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
          >
            通常画面に戻る
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-20 md:w-64 bg-gray-800 flex-shrink-0 flex flex-col items-center md:items-stretch py-4 gap-2">
          {[
            { id: 'zones', label: '区画管理', icon: Map },
            { id: 'points', label: '拠点管理', icon: MapPin },
            { id: 'members', label: '会員管理', icon: Users },
            { id: 'cats', label: 'ネコ管理', icon: CatIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                w-full p-4 md:px-6 flex flex-col md:flex-row items-center md:gap-4 transition-all
                ${activeTab === tab.id 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <tab.icon size={24} />
              <span className="text-xs md:text-sm font-bold mt-1 md:mt-0">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-2xl font-bold text-gray-800">
              {activeTab === 'cats' && '登録ネコ一覧'}
              {activeTab === 'points' && '餌やり拠点一覧'}
              {activeTab === 'zones' && '区画エリア一覧'}
              {activeTab === 'members' && 'アプリ会員(活動員)一覧'}
            </h2>
            
            <div className="flex gap-3 w-full md:w-auto">
              {activeTab !== 'zones' && (
                <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="検索..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-orange-500"
                  />
                </div>
              )}
              <button 
                onClick={() => {
                  if (activeTab === 'cats') startAddCat();
                  else if (activeTab === 'points') startAddPoint();
                  else if (activeTab === 'members') startAddMember();
                  else setEditingZone({id: `zone-${Date.now()}`, name: '', description: ''});
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm whitespace-nowrap"
              >
                <Plus size={18} /> 新規追加
              </button>
            </div>
          </div>

          {/* --- CATS VIEW --- */}
          {activeTab === 'cats' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCats.map(cat => (
                <div key={cat.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex gap-4 hover:border-orange-300 transition-colors">
                  <img src={cat.imageUrl} alt={cat.name} className="w-20 h-20 rounded-lg object-cover bg-gray-100" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 truncate">{cat.name}</h3>
                      <button 
                        onClick={() => startEditCat(cat)}
                        className="text-gray-400 hover:text-orange-500 p-1"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} /> {getZoneName(points.find(p => p.id === cat.pointId)?.zoneId || '')} / {getPointName(cat.pointId)}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 truncate">{cat.features}</p>
                    <div className={`mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      cat.status === 'healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cat.status === 'healthy' ? '健康' : '要観察'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* --- POINTS VIEW --- */}
          {activeTab === 'points' && (
             <div className="space-y-6">
               {zones.map(zone => {
                 const zonePoints = filteredPoints.filter(p => p.zoneId === zone.id);
                 if (zonePoints.length === 0) return null;
                 return (
                   <div key={zone.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-bold text-gray-700 flex justify-between">
                        <span>{zone.name}</span>
                        <span className="text-xs bg-white px-2 py-1 rounded border text-gray-500">{zonePoints.length}箇所</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {zonePoints.map(point => (
                          <div key={point.id} className="p-4 flex items-center justify-between hover:bg-orange-50 transition-colors group">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-gray-800">{point.name}</h4>
                                {point.lat && point.lng ? (
                                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <CheckCircle size={10} /> 座標設定済
                                  </span>
                                ) : (
                                  <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded flex items-center gap-1">
                                    <AlertCircle size={10} /> 未設定
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400 mt-1 font-mono">
                                {point.lat && point.lng ? `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}` : '---'}
                              </p>
                            </div>
                            <button 
                              onClick={() => startEditPoint(point)}
                              className="p-2 text-gray-300 hover:text-orange-500 hover:bg-white rounded-full transition-all"
                            >
                              <Pencil size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                   </div>
                 );
               })}
             </div>
          )}

          {/* --- ZONES VIEW --- */}
          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 gap-4">
              {zones.map(zone => (
                <div key={zone.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex justify-between items-center">
                   <div>
                     <h3 className="font-bold text-lg text-gray-800">{zone.name}</h3>
                     <p className="text-gray-500 text-sm mt-1">{zone.description}</p>
                     <p className="text-xs text-gray-400 mt-2">
                       所属スポット: {points.filter(p => p.zoneId === zone.id).length}箇所
                     </p>
                   </div>
                   <button 
                     onClick={() => setEditingZone({...zone})}
                     className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50"
                   >
                     編集
                   </button>
                </div>
              ))}
            </div>
          )}

          {/* --- MEMBERS VIEW --- */}
          {activeTab === 'members' && (
            <div className="grid grid-cols-1 gap-4">
              {filteredMembers.map(member => (
                <div key={member.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex gap-4 hover:border-orange-300 transition-colors items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400">
                    <Users size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-800">{member.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${member.role === 'admin' ? 'bg-gray-800 text-white' : 'bg-blue-100 text-blue-800'}`}>
                          {member.role === 'admin' ? '管理者' : '活動員'}
                        </span>
                      </div>
                      <button 
                        onClick={() => setEditingMember({...member})}
                        className="text-gray-400 hover:text-orange-500 p-1"
                      >
                        <Pencil size={16} />
                      </button>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Smartphone size={12} className="text-gray-400" />
                        <span className="truncate">{member.phoneModel || '機種不明'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <MessageCircle size={12} className="text-gray-400" />
                         <span className="truncate">{member.contactMethod || '連絡先不明'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-gray-400" />
                        <span className="truncate">{member.availableHours || '時間未設定'}</span>
                      </div>
                      <div className={`flex items-center gap-1 ${isExpired(member.membershipExpiry) ? 'text-red-500 font-bold' : ''}`}>
                        <Calendar size={12} className={isExpired(member.membershipExpiry) ? 'text-red-500' : 'text-gray-400'} />
                        <span>有効期限: {member.membershipExpiry} {isExpired(member.membershipExpiry) && '(期限切れ)'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Edit Cat Modal */}
      {editingCat && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">ネコ情報を編集</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">名前</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg font-bold" 
                  value={editingCat.name}
                  onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                />
              </div>

              {/* Priority Points Selection */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 space-y-3">
                 <h4 className="text-xs font-bold text-gray-500 mb-2 border-b border-blue-200 pb-1">担当スポット (優先度順)</h4>
                 
                 {[0, 1, 2, 3].map((index) => {
                     // Filter options: exclude items selected in HIGHER priority (lower index)
                     const higherPrioritySelections = catPriorityPoints.filter((_, i) => i < index);
                     
                     return (
                       <div key={index}>
                         <label className="block text-[10px] text-gray-500 font-bold mb-1">
                            {index === 0 ? '優先度1 (メインスポット/区画自動決定)' : `優先度${index + 1}`}
                         </label>
                         <select 
                           value={catPriorityPoints[index]} 
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

              {/* Split Feature Selection (Granular) */}
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

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSaveCat}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Point Modal */}
      {editingPoint && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">拠点情報を編集</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">拠点名</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg font-bold" 
                  value={editingPoint.name}
                  onChange={e => setEditingPoint({...editingPoint, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">所属区画</label>
                <select 
                  className="w-full p-3 bg-gray-50 border rounded-lg text-sm"
                  value={editingPoint.zoneId}
                  onChange={e => setEditingPoint({...editingPoint, zoneId: e.target.value})}
                >
                  {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">座標 (DMSまたは10進数)</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg font-mono text-sm" 
                  value={coordInput}
                  onChange={e => setCoordInput(e.target.value)}
                  placeholder="31.904, 131.464"
                />
                {coordError && <p className="text-red-500 text-xs mt-1">{coordError}</p>}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setEditingPoint(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSavePoint}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Zone Modal */}
      {editingZone && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">区画エリアを編集</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">区画名</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg font-bold" 
                  value={editingZone.name}
                  onChange={e => setEditingZone({...editingZone, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">説明</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg" 
                  value={editingZone.description}
                  onChange={e => setEditingZone({...editingZone, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setEditingZone(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSaveZone}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">会員情報を編集</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500">氏名</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg font-bold" 
                  value={editingMember.name}
                  onChange={e => setEditingMember({...editingMember, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-gray-500">権限</label>
                   <select 
                      className="w-full p-3 bg-gray-50 border rounded-lg text-sm"
                      value={editingMember.role}
                      onChange={e => setEditingMember({...editingMember, role: e.target.value as any})}
                   >
                     <option value="general">ボランティア</option>
                     <option value="admin">管理者</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-500">有効期限</label>
                   <input 
                     type="date"
                     className="w-full p-3 bg-gray-50 border rounded-lg text-sm" 
                     value={editingMember.membershipExpiry}
                     onChange={e => setEditingMember({...editingMember, membershipExpiry: e.target.value})}
                   />
                 </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">連絡手段</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg" 
                  value={editingMember.contactMethod}
                  onChange={e => setEditingMember({...editingMember, contactMethod: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">使用スマホ機種</label>
                <input 
                  className="w-full p-3 bg-gray-50 border rounded-lg" 
                  value={editingMember.phoneModel}
                  onChange={e => setEditingMember({...editingMember, phoneModel: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold"
                >
                  キャンセル
                </button>
                <button 
                  onClick={handleSaveMember}
                  className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
