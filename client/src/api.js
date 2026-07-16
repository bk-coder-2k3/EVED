import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // During dev, use explicit port if proxy fails
});

export default api;
