<template>
  <div class="tienda-container">
    <div class="container">
      <header>
        <h1>Simulación de Gestión de Tienda</h1>
        <div class="subtitle">Análisis de ventas y ganancias por día</div>
      </header>

      <div class="content">
        <!-- Panel de configuración -->
        <div class="config-panel">
          <div class="config-grid">
            <div class="config-group">
              <label for="horas">Horas por día:</label>
              <input type="number" id="horas" v-model.number="HORAS" min="1" max="24">
            </div>
            <div class="config-group">
              <label for="simulaciones">Días a simular:</label>
              <input type="number" id="simulaciones" v-model.number="SIMULACIONES" min="1" max="100">
            </div>
            <div class="config-group">
              <label for="llegadaMin">Llegadas mínimas por hora:</label>
              <input type="number" id="llegadaMin" v-model.number="LLEGADAS_MIN" min="0" step="0.1">
            </div>
            <div class="config-group">
              <label for="llegadaMax">Llegadas máximas por hora:</label>
              <input type="number" id="llegadaMax" v-model.number="LLEGADAS_MAX" min="0" step="0.1">
            </div>
          </div>
          <div class="config-grid">
            <div class="config-group">
              <label for="costoFijo">Costo fijo diario (Bs):</label>
              <input type="number" id="costoFijo" v-model.number="COSTO_FIJO" min="0" step="10">
            </div>
            <div class="config-group">
              <label for="costoArt">Costo por artículo (Bs):</label>
              <input type="number" id="costoArt" v-model.number="COSTO_ART" min="0" step="5">
            </div>
            <div class="config-group">
              <label for="precioArt">Precio de venta (Bs):</label>
              <input type="number" id="precioArt" v-model.number="PRECIO_ART" min="0" step="5">
            </div>
            <div class="config-group">
              <label for="semilla">Semilla (opcional):</label>
              <input type="number" id="semilla" v-model.number="semilla" placeholder="Vacío para aleatorio">
            </div>
          </div>

          <!-- Editor de Probabilidades -->
          <div class="probabilities-panel">
            <div class="probabilities-header">
              <h3>🎯 Distribución de Probabilidades de Compra</h3>
              <div class="probabilities-summary">
                <span>Total: {{ sumaProbabilidades.toFixed(2) }}</span>
                <span :class="sumaProbabilidades === 1 ? 'valid' : 'invalid'">
                  {{ sumaProbabilidades === 1 ? '✅ Válido' : '❌ Debe sumar 1.00' }}
                </span>
              </div>
            </div>

            <div class="probabilities-grid">
              <div v-for="(prob, index) in probabilidades" :key="index" class="probability-item">
                <div class="prob-input-group">
                  <label class="prob-label">Artículos {{ articulos[index] }}:</label>
                  <input
                    type="number"
                    v-model.number="probabilidades[index]"
                    min="0"
                    max="1"
                    step="0.05"
                    class="prob-input"
                    @change="validarProbabilidad(index)"
                  >
                  <span class="prob-percent">{{ (prob * 100).toFixed(0) }}%</span>
                </div>
                <div class="prob-visual">
                  <div class="prob-bar">
                    <div
                      class="prob-bar-fill"
                      :style="{ width: (prob * 100) + '%' }"
                      :class="getBarColor(index)"
                    ></div>
                  </div>
                </div>
                <button
                  @click="eliminarProbabilidad(index)"
                  class="delete-btn"
                  :disabled="probabilidades.length <= 1"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div class="probabilities-controls">
              <button @click="agregarProbabilidad" class="add-btn">
                ➕ Agregar Artículo
              </button>
              <button @click="resetearProbabilidades" class="reset-btn">
                🔄 Restablecer
              </button>
              <button @click="distribuirEquitativamente" class="distribute-btn">
                ⚖️ Distribuir Equitativamente
              </button>
            </div>

            <div class="probabilities-preview">
              <h4>Vista Previa de la Distribución:</h4>
              <div class="preview-grid">
                <div v-for="(prob, index) in probabilidades" :key="index" class="preview-item">
                  <span class="preview-articles">{{ articulos[index] }} artículos</span>
                  <span class="preview-prob">{{ (prob * 100).toFixed(1) }}%</span>
                  <span class="preview-acum">(Acum: {{ probabilidadesAcumuladas[index].toFixed(2) }})</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="ejecutarSimulacion" class="run-btn" :disabled="sumaProbabilidades !== 1">
            🏪 Ejecutar Simulación {{ sumaProbabilidades !== 1 ? '(Probabilidades inválidas)' : '' }}
          </button>
        </div>

        <!-- Tabla Resumen Principal -->
        <div class="results-container" v-if="dias.length > 0">
          <div class="table-wrapper main-table">
            <div class="table-header main-header">
              <div class="header-cell dia">Día</div>
              <div class="header-cell articulos">Artículos Vendidos</div>
              <div class="header-cell ingresos">Ingresos (Bs)</div>
              <div class="header-cell costo-art">Costo Art (Bs)</div>
              <div class="header-cell costo-fijo">Costo Fijo (Bs)</div>
              <div class="header-cell ganancia">Ganancia Neta (Bs)</div>
            </div>

            <div class="table-body">
              <div v-for="dia in dias" :key="dia.numero" class="result-row">
                <div class="cell dia">{{ dia.numero }}</div>
                <div class="cell articulos">{{ dia.totalArticulos }}</div>
                <div class="cell ingresos">{{ dia.ingresos.toFixed(2) }}</div>
                <div class="cell costo-art">{{ dia.costoArt.toFixed(2) }}</div>
                <div class="cell costo-fijo">{{ dia.costoFijo.toFixed(2) }}</div>
                <div class="cell ganancia" :class="dia.ganancia >= 0 ? 'positivo' : 'negativo'">
                  {{ dia.ganancia.toFixed(2) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Pruebas de Escritorio -->
        <div class="pruebas-container" v-if="pruebasEscritorio.length > 0">
          <div class="pruebas-header">
            <h3>Pruebas de Escritorio por Día</h3>
            <div class="pruebas-controls">
              <button @click="mostrarTodos = !mostrarTodos" class="toggle-btn">
                {{ mostrarTodos ? '📕 Ocultar Todos' : '📖 Mostrar Todos' }}
              </button>
            </div>
          </div>

          <div class="dias-pruebas">
            <div v-for="pruebaDia in pruebasEscritorio" :key="pruebaDia.dia" class="dia-prueba">
              <div class="dia-header" @click="toggleDia(pruebaDia.dia)">
                <h4>=== PRUEBA DE ESCRITORIO — Día {{ pruebaDia.dia }} ===</h4>
                <span class="toggle-icon">{{ diaVisible[pruebaDia.dia] ? '▼' : '►' }}</span>
              </div>

              <div class="horas-container" v-if="diaVisible[pruebaDia.dia] || mostrarTodos">
                <div v-for="hora in pruebaDia.horas" :key="hora.numero" class="hora-item">
                  <div class="hora-line">
                    Hora {{ hora.numero }}: randLleg={{ hora.randLlegada.toFixed(4) }} → {{ hora.llegadas }} clientes
                  </div>

                  <div v-for="(cliente, index) in hora.clientes" :key="index" class="cliente-item">
                    Cliente {{ index + 1 }}: randArt={{ cliente.randArticulo.toFixed(4) }} → {{ cliente.articulos }} artículos
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Resumen Final -->
        <div class="resumen-final" v-if="dias.length > 0">
          <div class="resumen-header">
            <h3>📊 RESUMEN GENERAL</h3>
          </div>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="resumen-label">Cantidad total de artículos vendidos ({{ SIMULACIONES }} días):</span>
              <span class="resumen-value">{{ totalArticulos5 }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Ganancia neta total del dueño ({{ SIMULACIONES }} días):</span>
              <span class="resumen-value" :class="totalGanancia5 >= 0 ? 'positivo' : 'negativo'">
                {{ totalGanancia5.toFixed(2) }} Bs
              </span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Ganancia neta promedio por día:</span>
              <span class="resumen-value" :class="gananciaPromedio >= 0 ? 'positivo' : 'negativo'">
                {{ gananciaPromedio.toFixed(2) }} Bs
              </span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Artículos promedio por día:</span>
              <span class="resumen-value">{{ articulosPromedio.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="quick-stats" v-if="dias.length > 0">
          <div class="quick-stat">
            <div class="quick-value">{{ totalArticulos5 }}</div>
            <div class="quick-label">Total Artículos</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ SIMULACIONES }}</div>
            <div class="quick-label">Días Simulados</div>
          </div>
          <div class="quick-stat" :class="totalGanancia5 >= 0 ? 'positivo' : 'negativo'">
            <div class="quick-value">{{ totalGanancia5.toFixed(0) }}</div>
            <div class="quick-label">Ganancia Total (Bs)</div>
          </div>
          <div class="quick-stat" :class="gananciaPromedio >= 0 ? 'positivo' : 'negativo'">
            <div class="quick-value">{{ gananciaPromedio.toFixed(0) }}</div>
            <div class="quick-label">Ganancia/Día (Bs)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Parámetros configurables
const HORAS = ref(10)
const SIMULACIONES = ref(5)
const LLEGADAS_MIN = ref(2.0)
const LLEGADAS_MAX = ref(4.0)
const COSTO_FIJO = ref(300.0)
const COSTO_ART = ref(50.0)
const PRECIO_ART = ref(75.0)
const semilla = ref(null)

// Distribución de artículos editable
const articulos = ref([0, 1, 2, 3])
const probabilidades = ref([0.2, 0.3, 0.4, 0.1])

// Estado de la simulación
const dias = ref([])
const pruebasEscritorio = ref([])
const totalArticulos5 = ref(0)
const totalGanancia5 = ref(0)
const diaVisible = ref({})
const mostrarTodos = ref(false)

// Computed properties para probabilidades
const sumaProbabilidades = computed(() => {
  return probabilidades.value.reduce((sum, prob) => sum + prob, 0)
})

const probabilidadesAcumuladas = computed(() => {
  let acumulado = 0
  return probabilidades.value.map(prob => {
    acumulado += prob
    return acumulado
  })
})

// Métodos para gestionar probabilidades
const validarProbabilidad = (index) => {
  if (probabilidades.value[index] < 0) {
    probabilidades.value[index] = 0
  } else if (probabilidades.value[index] > 1) {
    probabilidades.value[index] = 1
  }
}

const agregarProbabilidad = () => {
  const nuevoArticulo = articulos.value.length > 0 ? Math.max(...articulos.value) + 1 : 0
  articulos.value.push(nuevoArticulo)
  probabilidades.value.push(0)
}

const eliminarProbabilidad = (index) => {
  if (probabilidades.value.length > 1) {
    articulos.value.splice(index, 1)
    probabilidades.value.splice(index, 1)
  }
}

const resetearProbabilidades = () => {
  articulos.value = [0, 1, 2, 3]
  probabilidades.value = [0.2, 0.3, 0.4, 0.1]
}

const distribuirEquitativamente = () => {
  const total = probabilidades.value.length
  const probabilidadEquitativa = 1 / total
  probabilidades.value = probabilidades.value.map(() => probabilidadEquitativa)
}

const getBarColor = (index) => {
  const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#d35400', '#34495e']
  return colors[index % colors.length]
}

const toggleDia = (dia) => {
  diaVisible.value[dia] = !diaVisible.value[dia]
}

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

// Función para seleccionar artículos (igual que en Java)
const seleccionarArticulos = (u, valores, probabilidades) => {
  let acum = 0.0
  for (let i = 0; i < valores.length; i++) {
    acum += probabilidades[i]
    if (u < acum) return valores[i]
  }
  return valores[valores.length - 1]
}

// Ejecutar simulación CORREGIDA
const ejecutarSimulacion = () => {
  // Reiniciar estado
  dias.value = []
  pruebasEscritorio.value = []
  totalArticulos5.value = 0
  totalGanancia5.value = 0
  diaVisible.value = {}

  for (let sim = 1; sim <= SIMULACIONES.value; sim++) {
    // Crear un nuevo generador para cada día con semilla diferente
    const seedBase = semilla.value !== null ? semilla.value + sim : Date.now() + sim
    const rand = new JavaRandom(seedBase)

    let totalArticulosDia = 0

    // Prueba de escritorio para este día
    const pruebaDia = {
      dia: sim,
      horas: []
    }

    // Simular cada hora del día
    for (let h = 1; h <= HORAS.value; h++) {
      // Generar nuevo random para llegadas de esta hora
      const uLleg = rand.nextDouble()
      const llegCont = LLEGADAS_MIN.value + (LLEGADAS_MAX.value - LLEGADAS_MIN.value) * uLleg
      const llegadas = Math.round(llegCont)

      const hora = {
        numero: h,
        randLlegada: uLleg,
        llegadas: llegadas,
        clientes: []
      }

      // Simular cada cliente de esta hora
      for (let c = 0; c < llegadas; c++) {
        // Generar nuevo random para artículos de este cliente
        const uArt = rand.nextDouble()
        const compra = seleccionarArticulos(uArt, articulos.value, probabilidades.value)
        totalArticulosDia += compra

        hora.clientes.push({
          randArticulo: uArt,
          articulos: compra
        })
      }

      pruebaDia.horas.push(hora)
    }

    pruebasEscritorio.value.push(pruebaDia)

    // Calcular resultados del día
    const ingresos = totalArticulosDia * PRECIO_ART.value
    const costoArt = totalArticulosDia * COSTO_ART.value
    const ganancia = ingresos - costoArt - COSTO_FIJO.value

    // Guardar día
    dias.value.push({
      numero: sim,
      totalArticulos: totalArticulosDia,
      ingresos: ingresos,
      costoArt: costoArt,
      costoFijo: COSTO_FIJO.value,
      ganancia: ganancia
    })

    // Acumular totales
    totalArticulos5.value += totalArticulosDia
    totalGanancia5.value += ganancia
  }

  // Mostrar el primer día por defecto
  if (pruebasEscritorio.value.length > 0) {
    diaVisible.value[1] = true
  }
}

// Estadísticas computadas
const gananciaPromedio = computed(() => {
  return dias.value.length > 0 ? totalGanancia5.value / dias.value.length : 0
})

const articulosPromedio = computed(() => {
  return dias.value.length > 0 ? totalArticulos5.value / dias.value.length : 0
})
</script>

<style scoped>
.tienda-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1400px;
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
  padding: 25px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.config-group {
  display: flex;
  flex-direction: column;
}

.config-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.config-group input {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
}

.config-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

.run-btn {
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 10px;
}

.run-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(230, 126, 34, 0.4);
}

/* Contenedor de resultados principal */
.results-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 25px;
}

.table-wrapper {
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Cabecera de tabla principal */
.table-header {
  display: grid;
  grid-template-columns: 8% 20% 18% 18% 18% 18%;
  background: #2c3e50;
  color: white;
  font-weight: 600;
  padding: 15px 20px;
  border-bottom: 2px solid #34495e;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.header-cell {
  padding: 0 10px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Cuerpo scrollable */
.table-body {
  flex: 1;
  overflow-y: auto;
  max-height: 550px;
}

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
  display: grid;
  grid-template-columns: 8% 20% 18% 18% 18% 18%;
  padding: 12px 20px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
}

.result-row:hover {
  background: #f8f9fa;
}

.cell {
  padding: 0 10px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
}

.cell.dia {
  font-weight: 600;
}

.cell.articulos {
  font-weight: 600;
  color: #2c3e50;
}

.cell.ganancia.positivo {
  color: #27ae60;
  font-weight: bold;
}

.cell.ganancia.negativo {
  color: #e74c3c;
  font-weight: bold;
}

/* Pruebas de escritorio */
.pruebas-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 25px;
}

.pruebas-header {
  background: #34495e;
  color: white;
  padding: 15px 20px;
  border-bottom: 2px solid #2c3e50;
}

.pruebas-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.dias-pruebas {
  max-height: 600px;
  overflow-y: auto;
  padding: 20px;
}

.dia-prueba {
  margin-bottom: 30px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.dia-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #3498db;
}

.dia-header h4 {
  margin: 0;
  color: #2c3e50;
  font-family: 'Courier New', monospace;
}

.hora-item {
  margin-bottom: 15px;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.hora-line {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
}

.cliente-item {
  padding: 5px 0 5px 20px;
  color: #7f8c8d;
  border-bottom: 1px dashed #ecf0f1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.cliente-item:last-child {
  border-bottom: none;
}

/* Resumen final */
.resumen-final {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 25px;
  border-radius: 8px;
  margin-bottom: 25px;
}

.resumen-header {
  text-align: center;
  margin-bottom: 20px;
}

.resumen-header h3 {
  margin: 0;
  font-size: 1.4rem;
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 15px;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.resumen-label {
  font-weight: 600;
  flex: 1;
}

.resumen-value {
  font-weight: bold;
  font-family: 'Courier New', monospace;
  margin-left: 15px;
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
}

.quick-stat {
  background: white;
  padding: 20px;
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
  font-size: 2rem;
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
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .resumen-grid {
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

  .config-grid {
    grid-template-columns: 1fr;
  }

  .table-header,
  .result-row {
    grid-template-columns: 15% 20% 20% 15% 15% 15%;
    font-size: 0.8rem;
  }

  .quick-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .dias-pruebas {
    max-height: 400px;
  }
}

@media (max-width: 480px) {
  .table-header,
  .result-row {
    grid-template-columns: 20% 20% 20% 20% 20%;
  }

  .header-cell.costo-fijo,
  .cell.costo-fijo {
    display: none;
  }

  .quick-stats {
    grid-template-columns: 1fr;
  }

  .resumen-item {
    flex-direction: column;
    gap: 5px;
    text-align: center;
  }
}
/* Estilos anteriores se mantienen igual, solo agrego los nuevos */
.tienda-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.container {
  max-width: 1400px;
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
  padding: 25px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.config-group {
  display: flex;
  flex-direction: column;
}

.config-group label {
  margin-bottom: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.config-group input {
  padding: 10px;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  background: white;
}

.config-group input:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 5px rgba(52, 152, 219, 0.3);
}

/* Panel de Probabilidades */
.probabilities-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin: 25px 0;
}

.probabilities-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3498db;
}

.probabilities-header h3 {
  margin: 0;
  color: #2c3e50;
}

.probabilities-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-weight: 600;
}

.probabilities-summary .valid {
  color: #27ae60;
}

.probabilities-summary .invalid {
  color: #e74c3c;
}

.probabilities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.probability-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.prob-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.prob-label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 100px;
}

.prob-input {
  width: 80px;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.prob-input:focus {
  outline: none;
  border-color: #3498db;
}

.prob-percent {
  font-weight: 600;
  color: #7f8c8d;
  min-width: 40px;
}

.prob-visual {
  flex: 1;
  max-width: 150px;
}

.prob-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.prob-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.delete-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
  transition: background 0.3s ease;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b;
}

.delete-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  opacity: 0.5;
}

.probabilities-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.add-btn, .reset-btn, .distribute-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.add-btn {
  background: #27ae60;
  color: white;
}

.add-btn:hover {
  background: #229954;
}

.reset-btn {
  background: #e67e22;
  color: white;
}

.reset-btn:hover {
  background: #d35400;
}

.distribute-btn {
  background: #3498db;
  color: white;
}

.distribute-btn:hover {
  background: #2980b9;
}

.probabilities-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.probabilities-preview h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 10px;
}

.preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border-left: 4px solid #3498db;
}

.preview-articles {
  font-weight: 600;
  color: #2c3e50;
}

.preview-prob {
  font-weight: bold;
  color: #27ae60;
}

.preview-acum {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-family: 'Courier New', monospace;
}

.run-btn {
  background: linear-gradient(135deg, #e67e22, #d35400);
  color: white;
  border: none;
  padding: 15px 30px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  width: 100%;
  margin-top: 10px;
}

.run-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(230, 126, 34, 0.4);
}

.run-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* Estilos restantes igual que antes... */
.results-container {
  background: white;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 25px;
}

.table-wrapper {
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 8% 20% 18% 18% 18% 18%;
  background: #2c3e50;
  color: white;
  font-weight: 600;
  padding: 15px 20px;
  border-bottom: 2px solid #34495e;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.header-cell {
  padding: 0 10px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-body {
  flex: 1;
  overflow-y: auto;
  max-height: 550px;
}

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

.result-row {
  display: grid;
  grid-template-columns: 8% 20% 18% 18% 18% 18%;
  padding: 12px 20px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
}

.result-row:hover {
  background: #f8f9fa;
}

.cell {
  padding: 0 10px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
}

.cell.ganancia.positivo {
  color: #27ae60;
  font-weight: bold;
}

.cell.ganancia.negativo {
  color: #e74c3c;
  font-weight: bold;
}

/* Responsive */
@media (max-width: 768px) {
  .probability-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .prob-input-group {
    justify-content: space-between;
  }

  .probabilities-controls {
    flex-direction: column;
  }

  .table-header,
  .result-row {
    grid-template-columns: 15% 20% 20% 15% 15% 15%;
    font-size: 0.8rem;
  }
}
.pruebas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #34495e;
  color: white;
  padding: 15px 20px;
  border-bottom: 2px solid #2c3e50;
}

.pruebas-controls {
  display: flex;
  gap: 10px;
}

.toggle-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.toggle-btn:hover {
  background: #2980b9;
}

.dia-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background: #3498db;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.dia-header:hover {
  background: #2980b9;
}

.dia-header h4 {
  margin: 0;
  font-family: 'Courier New', monospace;
}

.toggle-icon {
  font-weight: bold;
  font-size: 1.2rem;
}

.horas-container {
  padding: 0 15px 15px 15px;
}

.hora-item {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #e67e22;
}

.hora-line {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 10px;
  font-family: 'Courier New', monospace;
  font-size: 1rem;
}

.cliente-item {
  padding: 8px 0 8px 20px;
  color: #7f8c8d;
  border-bottom: 1px dashed #ecf0f1;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
}

.cliente-item:last-child {
  border-bottom: none;
}

/* Los demás estilos se mantienen igual que en la versión anterior */
</style>
