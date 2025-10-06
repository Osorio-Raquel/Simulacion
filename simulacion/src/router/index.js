
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/azucar',
      name: 'azucar',
      component: () => import('../components/Azucar.vue'),
    },
    {
      path: '/encontrarmax',
      name: 'encontrarmax',
      component: () => import('../components/EncontrarMax.vue'),
    },
    {
      path: '/granero',
      name: 'granero',
      component: () => import('../components/Granero.vue'),
    },
    {
      path: '/juegos',
      name: 'juegos',
      component: () => import('../components/Juegos.vue'),
    },
    {
      path: '/plazofijo',
      name: 'plazofijo',
      component: () => import('../components/PlazoFijo.vue'),
    },
    {
      path: '/tienda',
      name: 'tienda',
      component: () => import('../components/Tienda.vue'),
    },
  ],
})

export default router
