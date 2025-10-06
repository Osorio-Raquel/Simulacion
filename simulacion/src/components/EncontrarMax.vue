<template>
  <div class="simulacion-container">
    <div class="container">
      <header>
        <h1>Simulación de Optimización</h1>
      </header>

      <div class="content">
        <div class="config-panel">
          <div class="config-group">
            <label for="nSimulaciones">Número de Simulaciones:</label>
            <input
              type="number"
              id="nSimulaciones"
              v-model.number="nSimulaciones"
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
             Ejecutar Simulación
          </button>
        </div>

        <!-- Resultados en contenedor scrollable -->
        <div class="results-container" v-if="resultados.length > 0">
          <div class="results-header">
            <h3>Resultados de la Simulación ({{ resultados.length }} válidas)</h3>
            <div class="results-info">
              <span>Intentos: {{ intentosTotales }} | Eficiencia: {{ eficiencia.toFixed(1) }}%</span>
            </div>
          </div>

          <div class="table-wrapper">
            <!-- Cabecera fija -->
            <div class="table-header">
              <div class="header-cell sim">Sim#</div>
              <div class="header-cell x1">x1</div>
              <div class="header-cell x2">x2</div>
              <div class="header-cell x3">x3</div>
              <div class="header-cell z">Z = 2x1+3x2-x3</div>
            </div>

            <!-- Cuerpo scrollable -->
            <div class="table-body">
              <!-- Filas de resultados -->
              <div
                v-for="resultado in resultados"
                :key="resultado.sim"
                class="result-row"
                :class="{ 'mejor-solucion': resultado.esMejor }"
              >
                <div class="cell sim">{{ resultado.sim }}</div>
                <div class="cell x1">{{ resultado.x1.toFixed(4) }}</div>
                <div class="cell x2">{{ resultado.x2 }}</div>
                <div class="cell x3">{{ resultado.x3.toFixed(4) }}</div>
                <div class="cell z">{{ resultado.z.toFixed(4) }}</div>
              </div>
            </div>
          </div>

          <!-- Mejor solución -->
          <div class="mejor-solucion-panel" v-if="mejorSolucion">
            <div class="mejor-solucion-header">
              <span class="trophy"></span>
              <span class="mejor-text">MEJOR SOLUCIÓN ENCONTRADA</span>
              <span class="trophy"></span>
            </div>
            <div class="mejor-solucion-details">
              Z = <span class="highlight">{{ mejorSolucion.z.toFixed(4) }}</span>
              | x1 = <span class="highlight">{{ mejorSolucion.x1.toFixed(4) }}</span>
              | x2 = <span class="highlight">{{ mejorSolucion.x2 }}</span>
              | x3 = <span class="highlight">{{ mejorSolucion.x3.toFixed(4) }}</span>
              | x1 + x2 = <span class="highlight">{{ (mejorSolucion.x1 + mejorSolucion.x2).toFixed(4) }}</span>
            </div>
          </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="quick-stats" v-if="resultados.length > 0">
          <div class="quick-stat">
            <div class="quick-value">{{ resultados.length }}</div>
            <div class="quick-label">Simulaciones Válidas</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ eficiencia.toFixed(1) }}%</div>
            <div class="quick-label">Eficiencia</div>
          </div>
          <div class="quick-stat best">
            <div class="quick-value">{{ mejorSolucion.z.toFixed(2) }}</div>
            <div class="quick-label">Mejor Z</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Configuración
const nSimulaciones = ref(100)
const semilla = ref(null)

// Estado de la simulación
const resultados = ref([])
const mejorSolucion = ref(null)
const intentosTotales = ref(0)

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

  nextInt(bound) {
    if (bound <= 0) throw new Error("Bound must be positive")

    if ((bound & -bound) === bound) {
      return Number((BigInt(bound) * BigInt(this.next(31))) >> BigInt(31))
    }

    let bits, val
    do {
      bits = this.next(31)
      val = bits % bound
    } while (bits - val + (bound - 1) < 0)

    return val
  }
}

// Ejecutar simulación
const ejecutarSimulacion = () => {
  // Reiniciar estado
  resultados.value = []
  mejorSolucion.value = null
  intentosTotales.value = 0

  const rand = semilla.value !== null ? new JavaRandom(semilla.value) : new JavaRandom()
  let guardadas = 0
  let mejorZ = -Infinity
  let mejorX1 = 0, mejorX2 = 0, mejorX3 = 0

  while (guardadas < nSimulaciones.value) {
    const x1 = rand.nextDouble() * 10.0
    const x2 = rand.nextInt(101)
    const x3 = 1.0 + rand.nextDouble()

    intentosTotales.value++

    if (x1 + x2 >= 2.0) {
      const Z = 2.0 * x1 + 3.0 * x2 - x3
      guardadas++

      const resultado = {
        sim: guardadas,
        x1: x1,
        x2: x2,
        x3: x3,
        z: Z,
        esMejor: false
      }

      resultados.value.push(resultado)

      if (Z > mejorZ) {
        mejorZ = Z
        mejorX1 = x1
        mejorX2 = x2
        mejorX3 = x3
      }
    }
  }

  // Marcar la mejor solución
  mejorSolucion.value = {
    x1: mejorX1,
    x2: mejorX2,
    x3: mejorX3,
    z: mejorZ
  }

  // Encontrar y marcar la mejor solución en los resultados
  const mejorIndex = resultados.value.findIndex(r =>
    Math.abs(r.z - mejorZ) < 1e-10 &&
    Math.abs(r.x1 - mejorX1) < 1e-10 &&
    r.x2 === mejorX2 &&
    Math.abs(r.x3 - mejorX3) < 1e-10
  )

  if (mejorIndex !== -1) {
    resultados.value[mejorIndex].esMejor = true
  }
}

// Estadísticas computadas
const eficiencia = computed(() => {
  return (resultados.value.length / intentosTotales.value) * 100
})
</script>

<style scoped>
.simulacion-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
  font-family: 'Courier New', monospace;
}

.container {
  max-width: 1000px;
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
  background: linear-gradient(135deg, #27ae60, #2ecc71);
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
  box-shadow: 0 5px 15px rgba(39, 174, 96, 0.4);
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
}

.header-cell {
  padding: 0 5px;
  font-family: 'Courier New', monospace;
}

.header-cell.sim { width: 15%; }
.header-cell.x1 { width: 20%; }
.header-cell.x2 { width: 15%; }
.header-cell.x3 { width: 20%; }
.header-cell.z { width: 30%; }

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
  padding: 10px 15px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
  font-family: 'Courier New', monospace;
}

.result-row:hover {
  background: #f8f9fa;
}

.result-row.mejor-solucion {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  font-weight: bold;
  border-left: 4px solid #e74c3c;
  position: relative;
}

.result-row.mejor-solucion::before {
  content: "★";
  position: absolute;
  left: 5px;
  top: 50%;
  transform: translateY(-50%);
  color: #e74c3c;
  font-size: 0.8rem;
}

.cell {
  padding: 0 5px;
}

.cell.sim {
  width: 15%;
  font-weight: 600;
  padding-left: 15px;
}
.cell.x1 { width: 20%; }
.cell.x2 { width: 15%; }
.cell.x3 { width: 20%; }
.cell.z {
  width: 30%;
  font-weight: 600;
  color: #2c3e50;
}

/* Mejor solución */
.mejor-solucion-panel {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  padding: 15px 20px;
  border-top: 3px solid #e74c3c;
}

.mejor-solucion-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2c3e50;
}

.trophy {
  font-size: 1.2rem;
}

.mejor-text {
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.mejor-solucion-details {
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 600;
}

.highlight {
  color: #e74c3c;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin: 0 2px;
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

.quick-stat.best {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  border-color: #e74c3c;
}

.quick-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
  font-family: 'Courier New', monospace;
}

.quick-stat.best .quick-value {
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
@media (max-width: 768px) {
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

  .header-cell,
  .cell {
    padding: 0 3px;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .mejor-solucion-details {
    font-size: 0.9rem;
  }

  .table-body {
    max-height: 400px;
  }
}

@media (max-width: 480px) {
  .container {
    margin: 10px;
    border-radius: 8px;
  }

  .content {
    padding: 15px;
  }

  .table-header,
  .result-row {
    flex-wrap: wrap;
  }

  .header-cell,
  .cell {
    width: 50% !important;
    margin-bottom: 5px;
  }

  .header-cell.sim,
  .cell.sim {
    width: 50% !important;
  }

  .header-cell.z,
  .cell.z {
    width: 50% !important;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }
}
</style>
