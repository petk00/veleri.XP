import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import routes from './routes';
import { getStoredUser } from 'src/utils/authStorage';

export default route(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach((to, from, next) => {
    const user = getStoredUser();
    const isLoggedIn = !!user;
    const publicRoutes = ['/login', '/set-password'];
    const isPublic = publicRoutes.some(p => to.path === p || to.path.startsWith(p + '/'));

    // Nepostojeća stranica (404) je uvijek dostupna — ne postoji resurs za zaštititi.
    if (to.name === 'not-found') {
      next();
      return;
    }

    if (!isLoggedIn && !isPublic) {
      next('/login');
      return;
    }

    const isLoginRoute = to.path === '/login';

    if (isLoggedIn && isLoginRoute) {
      next('/dashboard');
      return;
    }

    // Admin stranice — zaposlenika vrati na dashboard (backend ionako vraća 403,
    // ali ovako ne vidi razlomljenu stranicu s error porukama)
    if (to.meta.requiresAdmin && user?.role_name !== 'Administrator') {
      next('/');
      return;
    }

    next();
  });

  return Router;
});