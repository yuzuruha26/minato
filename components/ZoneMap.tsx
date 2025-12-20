
import React, { useEffect, useRef, useState } from 'react';
import { FeedingPoint, Zone, Cat, User } from '../types';
import { MapPin, Navigation, Droplets, ArrowLeft, Map as MapIcon, AlertCircle, Pencil, Save, X, Plus, Home } from 'lucide-react';

interface ZoneMapProps {
  zone: Zone;
  points: FeedingPoint[];
  cats: Cat[];
  wateredPoints: string[];
  onBack: () => void;
  onHome: () => void;
  onSelectPoint: (point: FeedingPoint) => void;
  currentUser: User;
  onUpdateZone: (zone: Zone) => void;
  onUpdatePoint: (point: FeedingPoint) => void;
  onAddPoint: (point: FeedingPoint) => void;
}

declare global {
  interface Window {
    google: any;
  }
}

export const ZoneMap: React.FC<ZoneMapProps> = ({ 
  zone, 
  points, 
  cats, 
  wateredPoints, 
  onBack, 
  onHome,
  onSelectPoint, 
  currentUser,
  onUpdateZone,
  onUpdatePoint,
  onAddPoint
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editZoneName, setEditZoneName] = useState(zone.name);
  const [editZoneDesc, setEditZoneDesc] = useState(zone.description);
  const [editPointNames, setEditPointNames] = useState<Record<string, string>>({});

  // Adding Point State
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [newPointName, setNewPointName] = useState('');

  useEffect(() => {
    setEditZoneName(zone.name);
    setEditZoneDesc(zone.description);
    const initialPointNames: Record<string, string> = {};
    points.forEach(p => initialPointNames[p.id] = p.name);
    setEditPointNames(initialPointNames);
  }, [zone, points, isEditing]);

  const handleSaveEdits = () => {
    if (currentUser.role !== 'admin') return; // Strict RBAC Guard

    onUpdateZone({ ...zone, name: editZoneName, description: editZoneDesc });
    points.forEach(p => {
      if (editPointNames[p.id] && editPointNames[p.id] !== p.name) {
        onUpdatePoint({ ...p, name: editPointNames[p.id] });
      }
    });
    setIsEditing(false);
  };

  const handleAddPointSubmit = () => {
    if (currentUser.role !== 'admin') return; // Strict RBAC Guard
    if (!newPointName) return;
    
    const newPoint: FeedingPoint = {
      id: `point-${Date.now()}`,
      name: newPointName,
      zoneId: zone.id
    };
    onAddPoint(newPoint);
    setIsAddingPoint(false);
    setNewPointName('');
  };

  // Calculate center based on points with coordinates, or default to Zone 1 center
  const getCenter = () => {
    const validPoints = points.filter(p => p.lat && p.lng);
    if (validPoints.length > 0) {
      const latSum = validPoints.reduce((sum, p) => sum + (p.lat || 0), 0);
      const lngSum = validPoints.reduce((sum, p) => sum + (p.lng || 0), 0);
      return { lat: latSum / validPoints.length, lng: lngSum / validPoints.length };
    }
    // Default fallback
    return { lat: 31.904778, lng: 131.464444 };
  };

  useEffect(() => {
    const loadMap = () => {
      if (!process.env.API_KEY) {
        setMapError("APIキーが設定されていません。");
        return;
      }

      if (window.google && window.google.maps) {
        initMap();
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => initMap();
      script.onerror = () => setMapError("Googleマップの読み込みに失敗しました。APIキーを確認してください。");
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current) return;

      try {
        const center = getCenter();
        const map = new window.google.maps.Map(mapRef.current, {
          center: center,
          zoom: 16,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
        mapInstanceRef.current = map;
        updateMarkers();
      } catch (e) {
        console.error(e);
        setMapError("マップの初期化中にエラーが発生しました。");
      }
    };

    loadMap();
  }, []);

  const updateMarkers = () => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const bounds = new window.google.maps.LatLngBounds();
    let hasPoints = false;

    points.forEach(point => {
      if (point.lat && point.lng) {
        hasPoints = true;
        const isWatered = wateredPoints.includes(point.id);
        
        const iconUrl = isWatered 
          ? "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" 
          : "http://maps.google.com/mapfiles/ms/icons/red-dot.png";

        const marker = new window.google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map: map,
          title: point.name,
          icon: {
            url: iconUrl
          },
          animation: window.google.maps.Animation.DROP
        });

        marker.addListener("click", () => {
          onSelectPoint(point);
        });

        bounds.extend(marker.getPosition());
        markersRef.current.push(marker);
      }
    });

    if (hasPoints) {
      map.fitBounds(bounds);
      const listener = window.google.maps.event.addListener(map, "idle", () => { 
        if (map.getZoom() > 17) map.setZoom(17); 
        window.google.maps.event.removeListener(listener); 
      });
    } else {
       map.setCenter(getCenter());
       map.setZoom(15);
    }
  };

  useEffect(() => {
    updateMarkers();
  }, [points, wateredPoints]);

  return (
    <div className="min-h-screen bg-[#fdfbf7] p-4 pb-20">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="sticky top-0 bg-[#fdfbf7]/90 backdrop-blur-sm z-10 py-4 mb-4 border-b border-orange-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex gap-2">
              <button onClick={onBack} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
                <ArrowLeft />
              </button>
              <button onClick={onHome} className="p-2 hover:bg-orange-100 rounded-full text-orange-600">
                <Home />
              </button>
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={editZoneName}
                    onChange={(e) => setEditZoneName(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-800 bg-white border border-orange-300 rounded px-2"
                  />
                  <input 
                    type="text" 
                    value={editZoneDesc}
                    onChange={(e) => setEditZoneDesc(e.target.value)}
                    className="w-full text-xs text-gray-500 bg-white border border-gray-300 rounded px-2 py-1"
                  />
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 leading-tight">{zone.name}</h1>
                  <p className="text-xs text-gray-500 font-medium">{zone.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Edit Controls */}
          {currentUser.role === 'admin' && (
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsAddingPoint(true)}
                    className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200"
                    title="スポットを追加"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-2 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
                  >
                    <X size={20} />
                  </button>
                  <button 
                    onClick={handleSaveEdits}
                    className="p-2 bg-orange-500 rounded-full text-white hover:bg-orange-600 shadow-sm"
                  >
                    <Save size={20} />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-orange-50 hover:text-orange-500"
                >
                  <Pencil size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Schematic Map Representation - Responsive Grid on Desktop */}
        <div className="w-full mx-auto">
          
          {/* Google Map Area */}
          <div className="mb-8 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-2 text-gray-600 font-bold text-sm">
                <MapIcon size={16} className="text-orange-500"/>
                <span>エリアマップ</span>
              </div>
              
              <div className="w-full h-72 md:h-96 bg-gray-100 rounded-2xl overflow-hidden shadow-md border border-orange-200 relative group">
                {mapError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-6 text-center">
                    <AlertCircle size={32} className="mb-2 text-red-400"/>
                    <p className="text-sm font-bold text-gray-600">{mapError}</p>
                    {currentUser.role === 'admin' && (
                      <p className="text-xs mt-2">※管理者により座標が登録されている場合のみマーカーが表示されます。</p>
                    )}
                  </div>
                ) : (
                  <div ref={mapRef} className="w-full h-full" />
                )}
              </div>
          </div>

          <div className="relative">
             {/* Mobile Connector Line - Hidden on Desktop Grid */}
             <div className="absolute left-4 top-0 bottom-4 w-1 bg-gradient-to-b from-orange-200 to-orange-400 rounded-full opacity-30 md:hidden"></div>
             
             <div className="md:grid md:grid-cols-2 lg:grid-cols-3 gap-4 pl-8 md:pl-0">
               {points.map((point, index) => {
                 const isWatered = wateredPoints.includes(point.id);
                 const catCount = cats.filter(c => c.pointId === point.id).length;
                 const hasCoords = point.lat && point.lng;
                 
                 return (
                   <div 
                     key={point.id}
                     onClick={() => !isEditing && onSelectPoint(point)}
                     className={`relative group animate-fade-in-right ${isEditing ? '' : 'cursor-pointer'}`}
                     style={{ animationDelay: `${index * 50}ms` }}
                   >
                     {/* Connector Line Dot - Mobile Only */}
                     <div className={`md:hidden absolute -left-[29px] top-1/2 transform -translate-y-1/2 w-4 h-4 rounded-full border-4 z-10 shadow-sm transition-transform duration-300 ${
                       isWatered 
                         ? 'bg-blue-500 border-blue-200' 
                         : 'bg-white border-orange-400'
                     } ${!isEditing && 'group-hover:scale-125'}`}></div>
                     
                     <div className={`p-4 rounded-2xl shadow-sm border transition-all h-full ${
                        isEditing 
                          ? 'bg-white border-orange-300 shadow-md ring-2 ring-orange-100'
                          : isWatered
                            ? 'bg-blue-50/30 border-blue-200 active:scale-[0.98] hover:shadow-md hover:border-blue-300'
                            : 'bg-white border-orange-100 active:scale-[0.98] hover:shadow-md hover:border-orange-300'
                     }`}>
                       <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 mb-2 w-full">
                           <MapPin size={18} className={isWatered ? "text-blue-500 shrink-0" : "text-orange-500 shrink-0"} />
                           
                           {isEditing ? (
                             <input 
                               type="text"
                               value={editPointNames[point.id] || point.name}
                               onChange={(e) => setEditPointNames({...editPointNames, [point.id]: e.target.value})}
                               className="w-full font-bold text-lg text-gray-800 border-b border-orange-300 focus:outline-none bg-transparent"
                             />
                           ) : (
                             <h3 className="font-bold text-lg text-gray-800">{point.name}</h3>
                           )}
                         </div>
                         {!isEditing && <Navigation size={16} className="text-gray-300 group-hover:text-orange-400 shrink-0" />}
                       </div>
                       
                       {/* Status Indicator */}
                       {!isEditing && (
                         <div className="flex items-center gap-4 text-xs font-medium mt-1">
                           <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
                             isWatered 
                               ? 'text-blue-600 bg-blue-100 border border-blue-200' 
                               : 'text-gray-400 bg-gray-50 border border-gray-200'
                           }`}>
                             <Droplets size={12} className={isWatered ? 'fill-blue-600' : ''} /> 
                             {isWatered ? '水やり: 完了' : '水やり: 未'}
                           </span>
                           <span className="text-gray-400">
                             ネコ: {catCount}匹
                           </span>
                           {!hasCoords && currentUser.role === 'admin' && (
                              <span className="text-orange-300 ml-auto flex items-center gap-1">
                                <AlertCircle size={10} /> 座標未設定
                              </span>
                           )}
                         </div>
                       )}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>
        </div>

        {/* Add Point Modal */}
        {isAddingPoint && currentUser.role === 'admin' && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-fade-in-up">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <MapPin size={20} className="text-orange-500" /> 新規スポット追加
                </h3>
                <button onClick={() => setIsAddingPoint(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">スポット名</label>
                  <input 
                    type="text" 
                    value={newPointName}
                    onChange={(e) => setNewPointName(e.target.value)}
                    placeholder="例: 新しい倉庫前"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 font-bold"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  ※座標などの詳細は追加後に編集画面から設定してください。
                </p>
                <button 
                  onClick={handleAddPointSubmit}
                  className="w-full py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} /> 追加する
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isEditing && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl z-20 flex items-center gap-3 animate-bounce">
            <Pencil size={18} />
            <span className="font-bold text-sm">編集中モード</span>
          </div>
        )}
      </div>
    </div>
  );
};
