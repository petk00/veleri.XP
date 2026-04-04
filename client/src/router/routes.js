const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        redirect: '/prijava'
      },
      {
        path: 'prijava',
        component: () => import('pages/PrijavaStranica.vue')
      },
      {
        path: 'moji-nalozi',
        component: () => import('pages/MojiNaloziStranica.vue')
      },
      {
        path: 'novi-nalog',
        component: () => import('pages/NoviNalogStranica.vue')
      }
    ]
  },

  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes