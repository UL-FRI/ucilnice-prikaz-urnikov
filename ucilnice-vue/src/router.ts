import { createRouter, createWebHistory } from 'vue-router';

export default createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'HomeView',
      component: () => import('./views/HomeView.vue'),
    },
    {
      path: '/select-classroom',
      name: 'SelectClassroom',
      component: () => import('./views/SelectClassroom.vue'),
    },
  ],
});
