import { useEffect, useState } from 'react';
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';
import { OPEN_WEATHER_MAP_API_KEY } from '../api/config';

export const useWeather = () => {
  const [weather, setWeather] = useState<string>('Loading...');
  const [location, setLocation] = useState<string>('');
  const [forecast, setForecast] = useState<any[]>([]); // State for 7-day weather forecast

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const { status } = await requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Permission to access location was denied');
          return;
        }

        const { coords } = await getCurrentPositionAsync({});
        const latitude = coords.latitude;
        const longitude = coords.longitude;
        const apiKey = OPEN_WEATHER_MAP_API_KEY;

        // Get city name from coordinates
        const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData && geoData.length > 0) {
          const cityName = geoData[0].name;
          setLocation(cityName);

          // Get 7-day weather forecast
          const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          if (weatherData && weatherData.list) {
            // Extract the forecast for the next 7 days (3-hour intervals, 8 data points per day)
            const dailyForecast = weatherData.list.filter((item: any, index: number) => index % 8 === 0).slice(0, 7); // Grab data for 7 days
            setForecast(dailyForecast);

            // Get current temperature for the city
            const currentWeather = weatherData.list[0];
            const temp = currentWeather.main.temp;
            setWeather(`${cityName} • ${new Date().toDateString()} • ${temp}°C`);
          } else {
            setWeather('Không thể lấy dữ liệu thời tiết');
          }
        } else {
          setLocation('Không rõ vị trí');
          setWeather('Không rõ thời tiết');
        }
      } catch (error) {
        console.error('Error fetching weather:', error);
        setWeather('Lỗi khi lấy thời tiết');
      }
    };

    fetchWeather();
  }, []);

  return { weather, location, forecast };
};
