import { useEffect, useState } from 'react';
import {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
} from 'expo-location';

export const useWeather = () => {
  const [weather, setWeather] = useState<string>('Loading...');
  const [location, setLocation] = useState<string>('');

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
        const apiKey = '6d5ac90d21f8113a18e752c59b2e2c65';

        const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData && geoData.length > 0) {
          const cityName = geoData[0].name;
          setLocation(cityName);

          const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
          const weatherRes = await fetch(weatherUrl);
          const weatherData = await weatherRes.json();

          if (weatherData && weatherData.main) {
            const temp = weatherData.main.temp;
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

  return { weather, location };
};
