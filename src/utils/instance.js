import axios from 'axios';

const instance = axios.create({});

instance.interceptors.request.use((config) => {
  config.headers['Content-Type'] = 'application/json';
  return config;
});

export default instance;
