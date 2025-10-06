<template>
  <div class="dados-container">
    <div class="container">
      <header>
        <h1>Simulación de Juegos de Dados</h1>
        <div class="subtitle">Casa vs Jugador - Lanzamientos de 2 dados</div>
      </header>

      <div class="content">
        <div class="config-panel">
          <div class="config-group">
            <label for="totalJuegos">Total de Lanzamientos:</label>
            <input
              type="number"
              id="totalJuegos"
              v-model.number="totalJuegos"
              min="1"
              max="10000"
            >
          </div>
          <div class="config-group">
            <label for="semilla">Semilla Aleatoria (opcional):</label>
            <input
              type="number"
              id="semilla"
              v-model.number="semilla"
              placeholder="Vacío para aleatorio"
            >
          </div>
          <button @click="ejecutarSimulacion" class="run-btn">
            🎲 Ejecutar Simulación
          </button>
        </div>

        <!-- Resultados en contenedor scrollable -->
        <div class="results-container" v-if="lanzamientos.length > 0">
          <div class="results-header">
            <h3>Simulación de {{ totalJuegos }} lanzamientos</h3>
            <div class="results-info">
              <span>Ganancia neta: {{ gananciaCasaAcum }} Bs. | Casa gana: {{ juegosCasa }} de {{ totalJuegos }} ({{ porcentajeCasa.toFixed(2) }}%)</span>
            </div>
          </div>

          <div class="table-wrapper">
            <!-- Cabecera fija -->
            <div class="table-header">
              <div class="header-cell nro">N°</div>
              <div class="header-cell rand">Rand1</div>
              <div class="header-cell dado">Dado1</div>
              <div class="header-cell rand">Rand2</div>
              <div class="header-cell dado">Dado2</div>
              <div class="header-cell suma">Suma</div>
              <div class="header-cell resultado">Resultado</div>
              <div class="header-cell ganancia">Ganancia (Bs)</div>
              <div class="header-cell ganancia-acum">Ganancia Acum (Bs)</div>
            </div>

            <!-- Cuerpo scrollable -->
            <div class="table-body">
              <!-- Filas de lanzamientos -->
              <div
                v-for="lanzamiento in lanzamientos"
                :key="lanzamiento.nro"
                class="result-row"
                :class="{ 'jugador-gana': lanzamiento.jugadorGana, 'casa-gana': !lanzamiento.jugadorGana }"
              >
                <div class="cell nro">{{ lanzamiento.nro }}</div>
                <div class="cell rand">{{ lanzamiento.raw1.toFixed(3) }}</div>
                <div class="cell dado">{{ lanzamiento.dado1 }}</div>
                <div class="cell rand">{{ lanzamiento.raw2.toFixed(3) }}</div>
                <div class="cell dado">{{ lanzamiento.dado2 }}</div>
                <div class="cell suma">{{ lanzamiento.suma }}</div>
                <div class="cell resultado">
                  <span :class="lanzamiento.jugadorGana ? 'jugador' : 'casa'">
                    {{ lanzamiento.resultado }}
                  </span>
                </div>
                <div class="cell ganancia" :class="lanzamiento.gananciaJuego < 0 ? 'negativo' : 'positivo'">
                  {{ lanzamiento.gananciaJuego }}
                </div>
                <div class="cell ganancia-acum" :class="lanzamiento.gananciaAcumulada < 0 ? 'negativo' : 'positivo'">
                  {{ lanzamiento.gananciaAcumulada }}
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen final -->
          <div class="resumen-panel">
            <div class="resumen-header">
              <span class="resumen-icon">📊</span>
              <span class="resumen-text">RESUMEN FINAL</span>
              <span class="resumen-icon">📊</span>
            </div>
            <div class="resumen-details">
              <div class="resumen-item">
                <span class="resumen-label">Ganancia neta de la casa:</span>
                <span class="resumen-value" :class="gananciaCasaAcum >= 0 ? 'positivo' : 'negativo'">
                  {{ gananciaCasaAcum }} Bs.
                </span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Juegos ganados por la casa:</span>
                <span class="resumen-value">{{ juegosCasa }} de {{ totalJuegos }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Porcentaje de juegos que gana la casa:</span>
                <span class="resumen-value">{{ porcentajeCasa.toFixed(2) }}%</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Juegos ganados por el jugador:</span>
                <span class="resumen-value">{{ totalJuegos - juegosCasa }} de {{ totalJuegos }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Porcentaje de juegos que gana el jugador:</span>
                <span class="resumen-value">{{ (100 - porcentajeCasa).toFixed(2) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="quick-stats" v-if="lanzamientos.length > 0">
          <div class="quick-stat">
            <div class="quick-value">{{ totalJuegos }}</div>
            <div class="quick-label">Total Lanzamientos</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ juegosCasa }}</div>
            <div class="quick-label">Casa Gana</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ totalJuegos - juegosCasa }}</div>
            <div class="quick-label">Jugador Gana</div>
          </div>
          <div class="quick-stat" :class="gananciaCasaAcum >= 0 ? 'positivo' : 'negativo'">
            <div class="quick-value">{{ gananciaCasaAcum }}</div>
            <div class="quick-label">Ganancia Neta (Bs)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Configuración
const totalJuegos = ref(10)
const semilla = ref(null)

// Estado de la simulación
const lanzamientos = ref([])
const juegosCasa = ref(0)
const gananciaCasaAcum = ref(0)

// Generador de números aleatorios similar a Java
class JavaRandom {
  constructor(seed = null) {
    this.seed = seed !== null ? BigInt(seed) : BigInt(Date.now())
    this.multiplier = BigInt(0x5DEECE66D)
    this.addend = BigInt(0xB)
    this.mask = (BigInt(1) << BigInt(48)) - BigInt(1)
  }

  next(bits) {
    this.seed = (this.seed * this.multiplier + this.addend) & this.mask
    return Number(this.seed >> (BigInt(48) - BigInt(bits)))
  }

  nextDouble() {
    return (this.next(26) * Math.pow(2, 27) + this.next(27)) / Math.pow(2, 53)
  }
}

// Ejecutar simulación
const ejecutarSimulacion = () => {
  // Reiniciar estado
  lanzamientos.value = []
  juegosCasa.value = 0
  gananciaCasaAcum.value = 0

  const rand = semilla.value !== null ? new JavaRandom(semilla.value) : new JavaRandom()
  let gananciaAcumulada = 0

  for (let i = 1; i <= totalJuegos.value; i++) {
    // Genera los números aleatorios
    const raw1 = rand.nextDouble()
    const raw2 = rand.nextDouble()

    // Dados entre 1 y 6
    const dado1 = Math.floor(raw1 * 6) + 1
    const dado2 = Math.floor(raw2 * 6) + 1
    const suma = dado1 + dado2

    // Lógica del juego
    const jugadorGana = (suma === 7)
    const gananciaJuego = jugadorGana ? -5 : 2
    gananciaAcumulada += gananciaJuego

    if (!jugadorGana) {
      juegosCasa.value++
    }

    const resultado = jugadorGana ? "Jugador gana" : "Casa gana"

    // Guardar lanzamiento
    lanzamientos.value.push({
      nro: i,
      raw1: raw1,
      dado1: dado1,
      raw2: raw2,
      dado2: dado2,
      suma: suma,
      resultado: resultado,
      jugadorGana: jugadorGana,
      gananciaJuego: gananciaJuego,
      gananciaAcumulada: gananciaAcumulada
    })
  }

  gananciaCasaAcum.value = gananciaAcumulada
}

// Estadísticas computadas
const porcentajeCasa = computed(() => {
  return (juegosCasa.value * 100.0) / totalJuegos.value
})
</script>

<style scoped>
.dados-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
  font-family: 'Courier New', monospace;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

header {
  background: #2c3e50;
  color: white;
  padding: 20px;
  text-align: center;
  border-bottom: 3px solid #34495e;
}

h1 {
  font-size: 2rem;
  margin-bottom: 8px;
  font-weight: 700;
}

.subtitle {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 300;
}

.content {
  padding: 25px;
}

/* Panel de configuración */
.config-panel {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
  display: flex;
  gap: 20px;
  align-items: end;
  flex-wrap: wrap;
}

.config-group {
  flex: 1;
  min-width: 200px;
}

.config-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.config-group input {
  width: 100%;
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  background: white;
}

.config-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.run-btn {
  background: linear-gradient(135deg, #9b59b6, #8e44ad);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.run-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(155, 89, 182, 0.4);
}

/* Contenedor principal de resultados */
.results-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 25px;
}

.results-header {
  background: #34495e;
  color: white;
  padding: 15px 20px;
  border-bottom: 2px solid #2c3e50;
}

.results-header h3 {
  margin: 0 0 5px 0;
  font-size: 1.2rem;
}

.results-info {
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Contenedor de tabla con scroll */
.table-wrapper {
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Cabecera fija */
.table-header {
  display: flex;
  background: #2c3e50;
  color: white;
  font-weight: 600;
  padding: 12px 15px;
  border-bottom: 2px solid #34495e;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.header-cell {
  padding: 0 5px;
  text-align: center;
}

.header-cell.nro { width: 6%; }
.header-cell.rand { width: 8%; }
.header-cell.dado { width: 6%; }
.header-cell.suma { width: 6%; }
.header-cell.resultado { width: 12%; }
.header-cell.ganancia { width: 10%; }
.header-cell.ganancia-acum { width: 14%; }

/* Cuerpo scrollable */
.table-body {
  flex: 1;
  overflow-y: auto;
  max-height: 550px;
}

/* Personalizar scrollbar */
.table-body::-webkit-scrollbar {
  width: 8px;
}

.table-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.table-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Filas de resultados */
.result-row {
  display: flex;
  padding: 8px 15px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.result-row:hover {
  background: #f8f9fa;
}

.result-row.jugador-gana {
  background: #e8f6f3;
  border-left: 4px solid #27ae60;
}

.result-row.casa-gana {
  background: #fef9e7;
  border-left: 4px solid #f39c12;
}

.cell {
  padding: 0 5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell.nro { width: 6%; font-weight: 600; }
.cell.rand { width: 8%; }
.cell.dado { width: 6%; font-weight: 600; }
.cell.suma { width: 6%; font-weight: 600; background: #f8f9fa; border-radius: 4px; }
.cell.resultado { width: 12%; }
.cell.ganancia { width: 10%; font-weight: 600; }
.cell.ganancia-acum { width: 14%; font-weight: 600; }

/* Colores para resultados */
.jugador {
  color: #27ae60;
  font-weight: 600;
}

.casa {
  color: #e67e22;
  font-weight: 600;
}

.positivo {
  color: #27ae60;
}

.negativo {
  color: #e74c3c;
}

/* Resumen final */
.resumen-panel {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 20px;
  border-top: 3px solid #3498db;
}

.resumen-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 15px;
  font-weight: bold;
}

.resumen-icon {
  font-size: 1.3rem;
}

.resumen-text {
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.resumen-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.resumen-label {
  font-weight: 600;
}

.resumen-value {
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.resumen-value.positivo {
  color: #2ecc71;
}

.resumen-value.negativo {
  color: #e74c3c;
}

/* Estadísticas rápidas */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.quick-stat {
  background: white;
  padding: 15px;
  border-radius: 8px;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: transform 0.2s ease;
}

.quick-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.quick-stat.positivo {
  background: linear-gradient(135deg, #e8f6f3, #d1f2eb);
  border-color: #27ae60;
}

.quick-stat.negativo {
  background: linear-gradient(135deg, #fdedec, #fadbd8);
  border-color: #e74c3c;
}

.quick-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
  font-family: 'Courier New', monospace;
}

.quick-stat.positivo .quick-value {
  color: #27ae60;
}

.quick-stat.negativo .quick-value {
  color: #e74c3c;
}

.quick-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Responsive */
@media (max-width: 1024px) {
  .config-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .config-group {
    min-width: auto;
  }

  .table-header,
  .result-row {
    font-size: 0.8rem;
  }

  .resumen-details {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    margin: 10px;
  }

  .content {
    padding: 15px;
  }

  .table-body {
    max-height: 400px;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  /* Scroll horizontal para tabla en móviles */
  .table-wrapper {
    overflow-x: auto;
  }

  .table-header,
  .result-row {
    min-width: 800px;
  }
}

@media (max-width: 480px) {
  .quick-stats {
    grid-template-columns: 1fr;
  }

  .resumen-item {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
}
</style>
