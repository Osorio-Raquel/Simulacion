<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="container">
    <header class="main-header">
      <h1>Ejercicios de Simulación</h1>
      <nav class="main-nav">
        <RouterLink to="/plazofijo">Plazo Fijo</RouterLink>
        <RouterLink to="/encontrarmax">Encontrar Max</RouterLink>
        <RouterLink to="/juegos">Juegos</RouterLink>
        <RouterLink to="/tienda">Tienda</RouterLink>
        <RouterLink to="/granero">Granero</RouterLink>
        <RouterLink to="/azucar">Azúcar</RouterLink>
      </nav>
    </header>
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.main-header {
  width: 100%;
  background: #2563eb;
  color: #fff;
  padding: 2rem 0 1rem 0;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  border-radius: 0 0 24px 24px;
}

.logo {
  margin-bottom: 0.5rem;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.10));
}

.main-header h1 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  letter-spacing: 1px;
}

.main-nav {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.main-nav a {
  color: #fff;
  background: #3b82f6;
  padding: 0.5rem 1.2rem;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s, color 0.2s;
  border: none;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.main-nav a.router-link-exact-active,
.main-nav a.router-link-active {
  background: #fff;
  color: #2563eb;
  font-weight: 700;
}
.main-nav a:hover {
  background: #60a5fa;
  color: #fff;
}

.main-content {
  width: 100%;
  max-width: 700px;
  margin: 2rem auto 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.07);
  padding: 2rem 1.5rem;
  min-height: 300px;
}
</style>
