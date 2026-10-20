import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import { initHost } from './bridge'
import './style.css'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: () => import('./views/Home.vue') },
    { path: '/list/:collection', name: 'list', component: () => import('./views/List.vue'), props: true },
    { path: '/search', name: 'search', component: () => import('./views/Search.vue') },
    { path: '/category/:id', name: 'category', component: () => import('./views/Category.vue'), props: true },
    { path: '/app/:id', name: 'app', component: () => import('./views/AppPage.vue'), props: true },
  ],
  scrollBehavior: (to, from, saved) => saved || { top: 0 },
})

createApp(App).use(router).mount('#app')
initHost(router)
