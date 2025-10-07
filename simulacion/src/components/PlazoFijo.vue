<template>
  <div class="plazo-fijo-container">
    <div class="container">
      <header>
        <h1>Simulador de Depósito a Plazo Fijo</h1>
        <p class="subtitle">Con tasas variables por rangos de monto y proyección anual</p>
      </header>

      <div class="content">
        <div class="sidebar">
          <!-- Panel de Tasas Variables -->
          <div class="section">
            <h2 class="section-title">Configuración de Tasas por Rango</h2>

            <div class="tasas-config">
              <div class="tasas-header">
                <h3>Tasas Variables por Monto</h3>
                <button @click="agregarRango" class="add-rango-btn">
                  + Agregar Rango
                </button>
              </div>

              <div class="rangos-list">
                <div v-for="(rango, index) in rangosTasas" :key="index" class="rango-item">
                  <div class="rango-header">
                    <span class="rango-title">Rango {{ index + 1 }}</span>
                    <button
                      @click="eliminarRango(index)"
                      class="delete-rango-btn"
                      :disabled="rangosTasas.length <= 1"
                    >
                      ×
                    </button>
                  </div>

                  <div class="rango-fields">
                    <div class="rango-field">
                      <label>Monto Mínimo ($)</label>
                      <input
                        type="number"
                        v-model.number="rango.min"
                        min="0"
                        @change="validarRango(index)"
                      >
                    </div>

                    <div class="rango-field">
                      <label>Monto Máximo ($)</label>
                      <input
                        type="number"
                        v-model.number="rango.max"
                        min="0"
                        @change="validarRango(index)"
                      >
                    </div>

                    <div class="rango-field">
                      <label>Tasa Anual (%)</label>
                      <input
                        type="number"
                        v-model.number="rango.tasa"
                        min="0"
                        step="0.01"
                        placeholder="4.00"
                      >
                    </div>
                  </div>

                  <div class="rango-display">
                    <span class="rango-text">
                      ${{ formatoMoneda(rango.min) }} - ${{ formatoMoneda(rango.max) }}
                    </span>
                    <span class="tasa-text">{{ rango.tasa }}%</span>
                  </div>
                </div>
              </div>

              <div class="tasas-summary">
                <div class="summary-item">
                  <span>Total rangos:</span>
                  <strong>{{ rangosTasas.length }}</strong>
                </div>
                <div class="summary-item">
                  <span>Tasa mínima:</span>
                  <strong>{{ tasaMinima }}%</strong>
                </div>
                <div class="summary-item">
                  <span>Tasa máxima:</span>
                  <strong>{{ tasaMaxima }}%</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="main-content">
          <div class="section">
            <h2 class="section-title">Simulación de Depósito a Plazo Fijo</h2>

            <div class="form-grid">
              <div class="form-group">
                <label for="capital">Monto Inicial (Capital)</label>
                <input type="number" id="capital" v-model.number="capital" placeholder="Ingrese el monto a invertir">
                <span class="currency">$</span>
              </div>

              <div class="form-group">
                <label for="tasa">Tasa de Interés Anual (%)</label>
                <input
                  type="number"
                  id="tasa"
                  v-model.number="tasa"
                  placeholder="Se calculará automáticamente"
                  step="0.01"
                  disabled
                >
                <span class="percentage">%</span>
              </div>

              <div class="form-group">
                <label for="plazo">Plazo (años)</label>
                <input type="number" id="plazo" v-model.number="plazo" placeholder="Ingrese el plazo en años" step="1" min="1" max="30">
                <span class="days">años</span>
              </div>

              <div class="form-group full-width">
                <label for="tipoTasa">Tipo de Tasa</label>
                <select id="tipoTasa" v-model="tipoTasa" class="tasa-select">
                  <option value="nominal">Tasa Nominal Anual</option>
                  <option value="efectiva">Tasa Efectiva Anual</option>
                </select>
              </div>
            </div>

            <!-- Información de la tasa aplicada -->
            <div v-if="rangoAplicado" class="tasa-info">
              <div class="tasa-info-card">
                <h4>Tasa Aplicada</h4>
                <div class="tasa-details">
                  <span class="rango-info">
                    Rango: ${{ formatoMoneda(rangoAplicado.min) }} - ${{ formatoMoneda(rangoAplicado.max) }}
                  </span>
                  <span class="tasa-valor">{{ rangoAplicado.tasa }}% anual</span>
                </div>
              </div>
            </div>

            <button @click="agregarSimulacion" class="simulate-btn">
              <span class="btn-icon">💰</span>
              Calcular y Agregar Simulación
            </button>

            <!-- Proyección Anual -->
            <div v-if="capital > 0 && plazo >= 1" class="proyeccion-anual">
              <h3>Proyección Anual</h3>
              <div class="table-container">
                <table class="proyeccion-table">
                  <thead>
                    <tr>
                      <th>Año</th>
                      <th>Capital Inicial</th>
                      <th>Interés Generado</th>
                      <th>Capital Final</th>
                      <th>Acumulado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="anio in proyeccionAnual" :key="anio.ano"
                        :class="['proyeccion-row', { 'current-year': anio.ano === plazo }]">
                      <td class="ano">{{ anio.ano }}</td>
                      <td class="capital-inicial">$ {{ formatoMoneda(anio.capitalInicial) }}</td>
                      <td class="interes-anual">$ {{ formatoMoneda(anio.interesAnual) }}</td>
                      <td class="capital-final">$ {{ formatoMoneda(anio.capitalFinal) }}</td>
                      <td class="acumulado">$ {{ formatoMoneda(anio.acumulado) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="current-result" v-if="capital > 0">
              <h3>Resumen Final</h3>
              <div class="result-grid">
                <div class="result-item">
                  <span class="result-label">Capital Inicial:</span>
                  <span class="result-value">$ {{ formatoMoneda(capital) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Interés Total:</span>
                  <span class="result-value">$ {{ formatoMoneda(interesTotal) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Monto Final:</span>
                  <span class="result-value">$ {{ formatoMoneda(montoFinal) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Tasa Aplicada:</span>
                  <span class="result-value">{{ tasaCalculada }}% anual</span>
                </div>
              </div>
            </div>

            <div v-if="simulaciones.length > 0" class="result-card">
              <div class="result-header">
                <h3 class="result-title">Historial de Simulaciones</h3>
                <button @click="limpiarSimulaciones" class="clear-btn">Limpiar</button>
              </div>

              <div class="table-container">
                <table class="simulation-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Capital</th>
                      <th>Plazo</th>
                      <th>Tasa</th>
                      <th>Tipo</th>
                      <th>Interés</th>
                      <th>Monto Final</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(sim, idx) in simulaciones" :key="idx" class="simulation-row">
                      <td class="sim-number">{{ idx + 1 }}</td>
                      <td class="capital">$ {{ formatoMoneda(sim.capital) }}</td>
                      <td class="plazo">{{ sim.plazo }} años</td>
                      <td class="tasa">{{ sim.tasa }}%</td>
                      <td class="tipo">
                        <span :class="['tipo-badge', sim.tipoTasa]">
                          {{ sim.tipoTasa === 'nominal' ? 'Nominal' : 'Efectiva' }}
                        </span>
                      </td>
                      <td class="interes">$ {{ formatoMoneda(sim.interes) }}</td>
                      <td class="monto-final">$ {{ formatoMoneda(sim.montoFinal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="summary">
                <h4>Resumen de Simulaciones</h4>
                <div class="summary-grid">
                  <div class="summary-item">
                    <span class="summary-label">Total Simulaciones:</span>
                    <span class="summary-value">{{ simulaciones.length }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Promedio Capital:</span>
                    <span class="summary-value">$ {{ formatoMoneda(promedioCapital) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Promedio Interés:</span>
                    <span class="summary-value">$ {{ formatoMoneda(promedioInteres) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Promedio Monto Final:</span>
                    <span class="summary-value">$ {{ formatoMoneda(promedioMontoFinal) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

// Variables del formulario
const capital = ref(1000)
const tasa = ref(0)
const plazo = ref(3) // Ahora en años completos
const tipoTasa = ref('nominal')

// Variables de resultado
const interesTotal = ref(0)
const montoFinal = ref(0)
const simulaciones = ref([])

// Rangos de tasas variables
const rangosTasas = ref([
  { min: 1, max: 1000, tasa: 4.0 },
  { min: 1001, max: 5000, tasa: 4.5 },
  { min: 5001, max: 10000, tasa: 5.0 },
  { min: 10001, max: 50000, tasa: 5.5 },
  { min: 50001, max: 1000000, tasa: 6.0 }
])

// Computed properties
const tasaCalculada = computed(() => {
  const capitalNum = parseFloat(capital.value)
  const rango = rangosTasas.value.find(r =>
    capitalNum >= r.min && capitalNum <= r.max
  )
  return rango ? rango.tasa : 0
})

const rangoAplicado = computed(() => {
  const capitalNum = parseFloat(capital.value)
  return rangosTasas.value.find(r =>
    capitalNum >= r.min && capitalNum <= r.max
  )
})

const tasaMinima = computed(() => {
  return Math.min(...rangosTasas.value.map(r => r.tasa))
})

const tasaMaxima = computed(() => {
  return Math.max(...rangosTasas.value.map(r => r.tasa))
})

// Proyección año por año
const proyeccionAnual = computed(() => {
  const capitalNum = parseFloat(capital.value)
  const tasaNum = parseFloat(tasaCalculada.value) / 100
  const plazoNum = parseInt(plazo.value)
  const proyeccion = []

  let capitalActual = capitalNum
  let interesAcumulado = 0

  for (let ano = 1; ano <= plazoNum; ano++) {
    let interesAnual

    if (tipoTasa.value === 'nominal') {
      // Interés simple anual
      interesAnual = capitalActual * tasaNum
    } else {
      // Interés compuesto anual
      interesAnual = capitalActual * tasaNum
    }

    const capitalFinal = capitalActual + interesAnual
    interesAcumulado += interesAnual

    proyeccion.push({
      ano: ano,
      capitalInicial: capitalActual,
      interesAnual: interesAnual,
      capitalFinal: capitalFinal,
      acumulado: interesAcumulado
    })

    // Para el siguiente año, el capital inicial es el capital final del año anterior
    capitalActual = capitalFinal
  }

  return proyeccion
})

// Resultados finales basados en la proyección
const resultadosFinales = computed(() => {
  if (proyeccionAnual.value.length > 0) {
    const ultimoAno = proyeccionAnual.value[proyeccionAnual.value.length - 1]
    return {
      interesTotal: ultimoAno.acumulado,
      montoFinal: ultimoAno.capitalFinal
    }
  }
  return { interesTotal: 0, montoFinal: capital.value }
})

const promedioCapital = computed(() =>
  simulaciones.value.length ?
  simulaciones.value.reduce((a, s) => a + s.capital, 0) / simulaciones.value.length : 0
)

const promedioInteres = computed(() =>
  simulaciones.value.length ?
  simulaciones.value.reduce((a, s) => a + s.interes, 0) / simulaciones.value.length : 0
)

const promedioMontoFinal = computed(() =>
  simulaciones.value.length ?
  simulaciones.value.reduce((a, s) => a + s.montoFinal, 0) / simulaciones.value.length : 0
)

// Diccionario de variables (actualizado con años)
const variables = ref([
  { nombre: "Capital Inicial", sigla: "C", clasificacion: "Exógena", unidad: "USD" },
  { nombre: "Tasa de Interés", sigla: "i", clasificacion: "Exógena", unidad: "%" },
  { nombre: "Plazo", sigla: "t", clasificacion: "Exógena", unidad: "años" },
  { nombre: "Interés Generado", sigla: "I", clasificacion: "Endógena", unidad: "USD" },
  { nombre: "Monto Final", sigla: "M", clasificacion: "Estado", unidad: "USD" },
  { nombre: "Rango de Tasa", sigla: "R", clasificacion: "Exógena", unidad: "USD" }
])

// Métodos para rangos de tasas
const agregarRango = () => {
  const ultimoRango = rangosTasas.value[rangosTasas.value.length - 1]
  const nuevoMin = ultimoRango ? ultimoRango.max + 1 : 1
  rangosTasas.value.push({
    min: nuevoMin,
    max: nuevoMin + 1000,
    tasa: 4.0
  })
}

const eliminarRango = (index) => {
  if (rangosTasas.value.length > 1) {
    rangosTasas.value.splice(index, 1)
  }
}

const validarRango = (index) => {
  const rango = rangosTasas.value[index]

  // Validar valores mínimos
  if (rango.min < 0) rango.min = 0
  if (rango.max < 0) rango.max = 0
  if (rango.tasa < 0) rango.tasa = 0

  // Validar que min <= max
  if (rango.min > rango.max) {
    rango.max = rango.min + 1
  }

  // Validar que no se solapen con otros rangos
  rangosTasas.value.forEach((otroRango, otroIndex) => {
    if (index !== otroIndex) {
      if (rango.min <= otroRango.max && rango.max >= otroRango.min) {
        // Ajustar para evitar solapamiento
        rango.min = otroRango.max + 1
      }
    }
  })
}

// Función para calcular el depósito
const calcular = () => {
  const resultados = resultadosFinales.value
  interesTotal.value = resultados.interesTotal
  montoFinal.value = resultados.montoFinal
  tasa.value = tasaCalculada.value
}

// Función para agregar una simulación a la lista
const agregarSimulacion = () => {
  calcular()
  simulaciones.value.unshift({
    capital: parseFloat(capital.value),
    tasa: parseFloat(tasaCalculada.value),
    plazo: parseFloat(plazo.value),
    tipoTasa: tipoTasa.value,
    interes: interesTotal.value,
    montoFinal: montoFinal.value,
    fecha: new Date().toLocaleString(),
    rango: rangoAplicado.value ? `$${formatoMoneda(rangoAplicado.value.min)}-$${formatoMoneda(rangoAplicado.value.max)}` : 'N/A'
  })
}

// Función para limpiar simulaciones
const limpiarSimulaciones = () => {
  simulaciones.value = []
}

// Función para formatear moneda
const formatoMoneda = (valor) => {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(valor)
}

// Recalcular cuando cambien los valores
watch([capital, plazo, tipoTasa, rangosTasas], () => {
  calcular()
}, { deep: true })

onMounted(() => {
  calcular()
})
</script>

<style scoped>
.proyeccion-anual {
  margin: 25px 0;
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.proyeccion-anual h3 {
  margin-bottom: 15px;
  color: #2c3e50;
  border-bottom: 2px solid #3498db;
  padding-bottom: 8px;
}

.proyeccion-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.proyeccion-table th {
  background: #34495e;
  color: white;
  padding: 12px 15px;
  text-align: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.proyeccion-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ecf0f1;
  text-align: center;
}

.proyeccion-row:hover {
  background: #f8f9fa;
}

.proyeccion-row.current-year {
  background: #e8f4fc;
  font-weight: 600;
}

.ano {
  font-weight: 600;
  color: #2c3e50;
  background: #f8f9fa;
}

.capital-inicial {
  color: #3498db;
  font-weight: 600;
}

.interes-anual {
  color: #27ae60;
  font-weight: 600;
}

.capital-final {
  color: #e67e22;
  font-weight: 600;
}

.acumulado {
  color: #9b59b6;
  font-weight: 600;
}

/* Ajustes responsive */
@media (max-width: 768px) {
  .proyeccion-table {
    font-size: 0.8rem;
  }

  .proyeccion-table th,
  .proyeccion-table td {
    padding: 8px 6px;
  }
}
.plazo-fijo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  background: white;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

header {
  background: #2c3e50;
  color: white;
  padding: 25px;
  text-align: center;
}

h1 {
  font-size: 2.2rem;
  margin-bottom: 10px;
  font-weight: 700;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  font-weight: 300;
}

.content {
  display: flex;
  min-height: 600px;
}

.sidebar {
  flex: 1;
  min-width: 400px;
  background: #f8f9fa;
  padding: 25px;
  border-right: 1px solid #eaeaea;
  max-height: 800px;
  overflow-y: auto;
}

.main-content {
  flex: 2;
  min-width: 500px;
  padding: 25px;
}

.section {
  margin-bottom: 35px;
}

.section-title {
  font-size: 1.3rem;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 3px solid #3498db;
  font-weight: 600;
}

/* Estilos del formulario */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 25px;
}

.form-group {
  position: relative;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #34495e;
  font-size: 0.95rem;
}

input, select {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

input:focus, select:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.currency, .percentage, .days {
  position: absolute;
  right: 15px;
  top: 40px;
  color: #7f8c8d;
  font-weight: 600;
}

.tasa-select {
  background: white;
  cursor: pointer;
}

/* Botón de simulación */
.simulate-btn {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 15px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.simulate-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
}

.btn-icon {
  font-size: 1.2rem;
}

/* Resultado actual */
.current-result {
  background: #e8f4fc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 25px;
  border-left: 4px solid #3498db;
}

.current-result h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.result-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.result-label {
  font-weight: 600;
  color: #34495e;
}

.result-value {
  font-weight: 700;
  color: #27ae60;
  font-size: 1.1rem;
}

/* Tarjeta de resultados */
.result-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.result-title {
  font-size: 1.4rem;
  color: #2c3e50;
  margin: 0;
}

.clear-btn {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.clear-btn:hover {
  background: #c0392b;
}

/* Tabla de simulaciones */
.table-container {
  overflow-x: auto;
  margin-bottom: 25px;
}

.simulation-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.simulation-table th {
  background: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  font-size: 0.9rem;
}

.simulation-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #ecf0f1;
}

.simulation-row:hover {
  background: #f8f9fa;
}

.sim-number {
  font-weight: 600;
  color: #7f8c8d;
}

.capital, .interes, .monto-final {
  font-weight: 600;
  color: #2c3e50;
}

.tipo-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.tipo-badge.nominal {
  background: #e8f4fc;
  color: #3498db;
}

.tipo-badge.efectiva {
  background: #e8f6f3;
  color: #27ae60;
}

/* Resumen */
.summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.summary h4 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: white;
  border-radius: 6px;
}

.summary-label {
  font-weight: 600;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.summary-value {
  font-weight: 700;
  color: #2c3e50;
}

/* Diagrama de flujo */
.flow-diagram {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.flow-step {
  margin-bottom: 10px;
}

.flow-node {
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.flow-node:hover {
  transform: translateY(-2px);
}

.flow-step.start .flow-node {
  background: #2ecc71;
  color: white;
}

.flow-step.process .flow-node {
  background: #3498db;
  color: white;
}

.flow-step.end .flow-node {
  background: #e74c3c;
  color: white;
}

.flow-icon {
  font-size: 1.5rem;
  margin-right: 15px;
}

.flow-content h3 {
  margin: 0 0 5px 0;
  font-size: 1rem;
  font-weight: 600;
}

.flow-content p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.flow-arrow {
  text-align: center;
  color: #7f8c8d;
  font-size: 1.2rem;
  margin: 5px 0;
}

/* Tabla de variables */
.variable-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.variable-table th {
  background: #3498db;
  color: white;
  padding: 12px;
  text-align: left;
  font-weight: 600;
}

.variable-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #ecf0f1;
}

.variable-table tr:nth-child(even) {
  background: #f8f9fa;
}

/* Responsive */
@media (max-width: 1024px) {
  .content {
    flex-direction: column;
  }

  .sidebar {
    border-right: none;
    border-bottom: 1px solid #eaeaea;
    max-height: none;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

.tasas-config {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.tasas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.tasas-header h3 {
  margin: 0;
  color: #2c3e50;
}

.add-rango-btn {
  background: #27ae60;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.add-rango-btn:hover {
  background: #229954;
}

.rangos-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.rango-item {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 15px;
  background: #f8f9fa;
}

.rango-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.rango-title {
  font-weight: 600;
  color: #2c3e50;
}

.delete-rango-btn {
  background: #e74c3c;
  color: white;
  border: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  transition: background 0.3s;
}

.delete-rango-btn:hover:not(:disabled) {
  background: #c0392b;
}

.delete-rango-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.rango-fields {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

.rango-field {
  display: flex;
  flex-direction: column;
}

.rango-field label {
  font-size: 0.8rem;
  margin-bottom: 5px;
  color: #7f8c8d;
}

.rango-field input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.9rem;
}

.rango-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
}

.rango-text {
  font-weight: 600;
  color: #2c3e50;
}

.tasa-text {
  font-weight: 700;
  color: #27ae60;
  background: #e8f6f3;
  padding: 4px 8px;
  border-radius: 4px;
}

.tasas-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 15px;
  background: #e8f4fc;
  border-radius: 6px;
}

.tasas-summary .summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.9rem;
}

.tasa-info {
  margin-bottom: 20px;
}

.tasa-info-card {
  background: linear-gradient(135deg, #e8f6f3, #d1f2eb);
  border: 2px solid #27ae60;
  border-radius: 8px;
  padding: 15px;
}

.tasa-info-card h4 {
  margin: 0 0 10px 0;
  color: #27ae60;
}

.tasa-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.rango-info {
  font-weight: 600;
  color: #2c3e50;
}

.tasa-valor {
  font-weight: 700;
  color: #27ae60;
  font-size: 1.1rem;
}

.clasificacion-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
}

.clasificacion-badge.exógena {
  background: #e8f4fc;
  color: #3498db;
}

.clasificacion-badge.endógena {
  background: #fef9e7;
  color: #f39c12;
}

.clasificacion-badge.estado {
  background: #e8f6f3;
  color: #27ae60;
}

@media (max-width: 768px) {
  .plazo-fijo-container {
    padding: 10px;
  }

  header {
    padding: 20px;
  }

  h1 {
    font-size: 1.8rem;
  }

  .sidebar, .main-content {
    padding: 20px;
  }

  .result-grid,
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .result-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
}
</style>
