<template>
  <div class="plazo-fijo-container">
    <div class="container">
      <header>
        <h1>Simulador de Depósito a Plazo Fijo</h1>
      </header>

      <div class="content">

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
                <input type="number" id="tasa" v-model.number="tasa" placeholder="Ingrese la tasa de interés" step="0.01">
                <span class="percentage">%</span>
              </div>

              <div class="form-group">
                <label for="plazo">Plazo (días)</label>
                <input type="number" id="plazo" v-model.number="plazo" placeholder="Ingrese el plazo en días">
                <span class="days">días</span>
              </div>

              <div class="form-group full-width">
                <label for="tipoTasa">Tipo de Tasa</label>
                <select id="tipoTasa" v-model="tipoTasa" class="tasa-select">
                  <option value="nominal">Tasa Nominal Anual</option>
                  <option value="efectiva">Tasa Efectiva Anual</option>
                </select>
              </div>
            </div>

            <button @click="agregarSimulacion" class="simulate-btn">
              <span class="btn-icon"></span>
              Calcular y Agregar Simulación
            </button>

            <div class="current-result" v-if="capital > 0">
              <h3>Resultado Actual</h3>
              <div class="result-grid">
                <div class="result-item">
                  <span class="result-label">Interés Generado:</span>
                  <span class="result-value">$ {{ formatoMoneda(interes) }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">Monto Final:</span>
                  <span class="result-value">$ {{ formatoMoneda(montoFinal) }}</span>
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
                      <td class="plazo">{{ sim.plazo }} días</td>
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
const tasa = ref(8)
const plazo = ref(360)
const tipoTasa = ref('nominal')

// Variables de resultado
const interes = ref(0)
const montoFinal = ref(0)
const simulaciones = ref([])

// Promedios
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

// Diccionario de variables
const variables = ref([
  { nombre: "Capital Inicial", sigla: "C", clasificacion: "Exógena", unidad: "USD" },
  { nombre: "Tasa de Interés", sigla: "i", clasificacion: "Exógena", unidad: "%" },
  { nombre: "Plazo", sigla: "t", clasificacion: "Exógena", unidad: "días" },
  { nombre: "Interés Generado", sigla: "I", clasificacion: "Endógena", unidad: "USD" },
  { nombre: "Monto Final", sigla: "M", clasificacion: "Estado", unidad: "USD" }
])

// Función para calcular el depósito
const calcular = () => {
  const capitalNum = parseFloat(capital.value)
  const tasaNum = parseFloat(tasa.value) / 100
  const plazoNum = parseFloat(plazo.value)

  if (tipoTasa.value === 'nominal') {
    // Para tasa nominal: I = C * i * (t/360)
    interes.value = capitalNum * tasaNum * (plazoNum / 360)
  } else {
    // Para tasa efectiva: I = C * [(1 + i)^(t/360) - 1]
    interes.value = capitalNum * (Math.pow(1 + tasaNum, plazoNum / 360) - 1)
  }

  montoFinal.value = capitalNum + interes.value
}

// Función para agregar una simulación a la lista
const agregarSimulacion = () => {
  calcular()
  simulaciones.value.unshift({
    capital: parseFloat(capital.value),
    tasa: parseFloat(tasa.value),
    plazo: parseFloat(plazo.value),
    tipoTasa: tipoTasa.value,
    interes: interes.value,
    montoFinal: montoFinal.value,
    fecha: new Date().toLocaleString()
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
watch([capital, tasa, plazo, tipoTasa], () => {
  calcular()
})

onMounted(() => {
  calcular()
})
</script>

<style scoped>
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
