
import React, { useEffect, useState } from 'react';
import { Sun, Cloud, CloudRain, CloudLightning, Snowflake, CloudFog, CloudDrizzle, Sunset, Loader2, Moon, CloudSun } from 'lucide-react';

// Coordinates for Miyazaki Port (based on ZoneMap default)
const LAT = 31.904778;
const LNG = 131.464444;

interface WeatherData {
  temp: number;
  weatherCode: number;
  sunset: string; // HH:mm
}

export const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&current=temperature_2m,weather_code&daily=sunset&timezone=Asia%2FTokyo`
        );
        const data = await response.json();

        if (data.current && data.daily && data.daily.sunset && data.daily.sunset.length > 0) {
          const sunsetTimeFull = data.daily.sunset[0]; // "2023-10-27T17:30"
          const sunsetDate = new Date(sunsetTimeFull);
          const sunsetStr = sunsetDate.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

          setWeather({
            temp: data.current.temperature_2m,
            weatherCode: data.current.weather_code,
            sunset: sunsetStr
          });
        } else {
          setError(true);
        }
      } catch (e) {
        console.error("Weather fetch failed", e);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (code: number) => {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return <Sun className="text-orange-500" size={24} />;
    if (code === 1 || code === 2 || code === 3) return <CloudSun className="text-orange-400" size={24} />;
    if (code >= 45 && code <= 48) return <CloudFog className="text-gray-400" size={24} />;
    if (code >= 51 && code <= 55) return <CloudDrizzle className="text-blue-400" size={24} />;
    if (code >= 61 && code <= 67) return <CloudRain className="text-blue-500" size={24} />;
    if (code >= 71 && code <= 77) return <Snowflake className="text-cyan-400" size={24} />;
    if (code >= 80 && code <= 82) return <CloudRain className="text-blue-600" size={24} />;
    if (code >= 95 && code <= 99) return <CloudLightning className="text-yellow-500" size={24} />;
    return <Cloud className="text-gray-400" size={24} />;
  };

  const getWeatherLabel = (code: number) => {
    if (code === 0) return '晴れ';
    if (code <= 3) return '曇り時々晴れ';
    if (code <= 48) return '霧';
    if (code <= 55) return '霧雨';
    if (code <= 67) return '雨';
    if (code <= 77) return '雪';
    if (code <= 82) return 'にわか雨';
    if (code <= 99) return '雷雨';
    return '曇り';
  };

  if (error) return null; // Hide widget on error

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-4 flex items-center justify-between max-w-4xl mx-auto mb-6">
      {loading ? (
        <div className="flex w-full justify-center items-center py-2 text-gray-400 gap-2">
           <Loader2 className="animate-spin" size={16} />
           <span className="text-xs">天気情報を取得中...</span>
        </div>
      ) : weather ? (
        <>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-full">
              {getWeatherIcon(weather.weatherCode)}
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold">現在の天気</p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-gray-800">{weather.temp}</span>
                <span className="text-sm text-gray-600 mb-1">°C</span>
                <span className="text-xs text-gray-500 mb-1 ml-1">({getWeatherLabel(weather.weatherCode)})</span>
              </div>
            </div>
          </div>

          <div className="h-8 w-px bg-gray-200 mx-2"></div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-bold">日入り</p>
              <p className="text-xl font-bold text-gray-800">{weather.sunset}</p>
            </div>
            <div className="p-2 bg-orange-50 rounded-full">
              <Sunset className="text-orange-500" size={24} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
