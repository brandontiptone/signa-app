import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ⚠️ Remplace par l'URL de ton backend déployé (ex: https://api.tonentreprise.com)
export const API_URL = 'http://localhost:4000/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
