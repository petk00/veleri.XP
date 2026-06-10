import { boot } from 'quasar/wrappers';
import { Notify } from 'quasar';
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL,
  withCredentials: true,
});

export default boot(({ app, router }) => {
  app.config.globalProperties.$api = api;

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && router.currentRoute.value.path !== '/login') {
        localStorage.removeItem('user');
        Notify.create({
          type: 'negative',
          message: 'Sesija je istekla. Molimo prijavite se ponovno.',
        });
        router.replace('/login');
      }
      return Promise.reject(error);
    }
  );
});

export { api };