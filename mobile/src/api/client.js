import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL de l'API back-end déployée sur Railway
export const API_URL = 'https://signa-backend-production-ceb6.up.railway.app/api';

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
