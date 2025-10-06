<template>
  <div class="azucar-container">
    <div class="container">
      <header>
        <h1>Simulación de Gestión de Inventario - Tienda de Azúcar</h1>
        <div class="subtitle">Sistema de revisión periódica (cada 7 días) - Horizonte: 60 días</div>
      </header>

      <div class="content">
        <!-- Panel de configuración -->
        <div class="config-panel">
          <div class="config-group">
            <label for="dias">Horizonte de simulación (días):</label>
            <input
              type="number"
              id="dias"
              v-model.number="DAYS"
              min="1"
              max="180"
            >
          </div>
          <div class="config-group">
            <label for="demanda">Demanda promedio (kg/día):</label>
            <input
              type="number"
              id="demanda"
              v-model.number="MEAN_DEMAND"
              min="1"
              step="0.1"
            >
          </div>
          <div class="config-group">
            <label for="capacidad">Capacidad bodega (kg):</label>
            <input
              type="number"
              id="capacidad"
              v-model.number="CAPACITY"
              min="1"
            >
          </div>
          <div class="config-group">
            <label for="semilla">Semilla Aleatoria (opcional):</label>
            <input
              type="number"
              id="semilla"
              v-model.number="semillaInput"
              placeholder="Vacío para aleatorio"
            >
          </div>
          <button @click="ejecutarSimulacion" class="run-btn">
            📊 Ejecutar Simulación
          </button>
        </div>

        <!-- Resultados en contenedor scrollable -->
        <div class="results-container" v-if="diasSimulados.length > 0">
          <div class="results-header">
            <h3>Simulación de {{ DAYS }} días</h3>
            <div class="results-info">
              <span>Ganancia neta: {{ gananciaNeta.toFixed(2) }} Bs. |
                    Demanda perdida: {{ totalLostDemand.toFixed(2) }} kg ({{ porcentajePerdido.toFixed(2) }}%)</span>
            </div>
          </div>

          <div class="table-wrapper">
            <!-- Cabecera fija -->
            <div class="table-header">
              <div class="header-cell dia">Día</div>
              <div class="header-cell rand">uPois</div>
              <div class="header-cell demanda">Demanda(kg)</div>
              <div class="header-cell inicio">Inicio(kg)</div>
              <div class="header-cell recepc">Recep(kg)</div>
              <div class="header-cell vend">Vend(kg)</div>
              <div class="header-cell perd">Perd(kg)</div>
              <div class="header-cell fin">Fin(kg)</div>
              <div class="header-cell pedidos">Pedidos</div>
            </div>

            <!-- Cuerpo scrollable -->
            <div class="table-body">
              <!-- Filas de días simulados -->
              <div
                v-for="dia in diasSimulados"
                :key="dia.dia"
                class="result-row"
                :class="{
                  'dia-revision': dia.esDiaRevision,
                  'con-pedido': dia.pedidoRealizado
                }"
              >
                <div class="cell dia">{{ dia.dia }}</div>
                <div class="cell rand">{{ dia.u.toFixed(3) }}</div>
                <div class="cell demanda">{{ dia.demanda.toFixed(2) }}</div>
                <div class="cell inicio">{{ dia.inicio.toFixed(2) }}</div>
                <div class="cell recepc">{{ dia.recepcion.toFixed(2) }}</div>
                <div class="cell vend">{{ dia.vendido.toFixed(2) }}</div>
                <div class="cell perd" :class="{ 'perdida': dia.perdido > 0 }">
                  {{ dia.perdido.toFixed(2) }}
                </div>
                <div class="cell fin">{{ dia.fin.toFixed(2) }}</div>
                <div class="cell pedidos">
                  <span v-if="dia.pedidoRealizado" class="pedido-realizado">
                    {{ dia.detallePedido }}
                  </span>
                  <span v-else-if="dia.pedidosEnTransito" class="pedidos-transito">
                    {{ dia.detallePedido }}
                  </span>
                  <span v-else>-</span>
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
                <span class="resumen-label">Total demanda (kg):</span>
                <span class="resumen-value">{{ totalDemanda.toFixed(2) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Total vendida (kg):</span>
                <span class="resumen-value">{{ totalVendido.toFixed(2) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Demanda insatisfecha (kg):</span>
                <span class="resumen-value negativo">{{ totalLostDemand.toFixed(2) }}</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Porcentaje demanda perdida:</span>
                <span class="resumen-value negativo">{{ porcentajePerdido.toFixed(2) }}%</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Promedio demanda diaria:</span>
                <span class="resumen-value">{{ promedioDemanda.toFixed(2) }} kg/día</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Costo de ordenar:</span>
                <span class="resumen-value">{{ totalOrderingCost.toFixed(2) }} Bs</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Costo adquisición:</span>
                <span class="resumen-value">{{ totalAcquisitionCost.toFixed(2) }} Bs</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Costo mantenimiento:</span>
                <span class="resumen-value">{{ totalHoldingCost.toFixed(2) }} Bs</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Costo total:</span>
                <span class="resumen-value">{{ costoTotal.toFixed(2) }} Bs</span>
              </div>
              <div class="resumen-item">
                <span class="resumen-label">Ingresos por ventas:</span>
                <span class="resumen-value">{{ totalRevenue.toFixed(2) }} Bs</span>
              </div>
              <div class="resumen-item destacado">
                <span class="resumen-label">GANANCIA NETA:</span>
                <span class="resumen-value" :class="gananciaNeta >= 0 ? 'positivo' : 'negativo'">
                  {{ gananciaNeta.toFixed(2) }} Bs
                </span>
              </div>
            </div>

            <!-- Evaluación de capacidad -->
            <div class="evaluacion-capacidad" :class="totalLostDemand > 0 ? 'insuficiente' : 'suficiente'">
              <strong>Evaluación de capacidad:</strong>
              {{ evaluacionCapacidad }}
            </div>
          </div>
        </div>

        <!-- Estadísticas rápidas -->
        <div class="quick-stats" v-if="diasSimulados.length > 0">
          <div class="quick-stat">
            <div class="quick-value">{{ DAYS }}</div>
            <div class="quick-label">Días Simulados</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ totalOrdersPlaced }}</div>
            <div class="quick-label">Órdenes Realizadas</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ totalLostDemand.toFixed(1) }}</div>
            <div class="quick-label">Kg Perdidos</div>
          </div>
          <div class="quick-stat" :class="gananciaNeta >= 0 ? 'positivo' : 'negativo'">
            <div class="quick-value">{{ gananciaNeta.toFixed(0) }}</div>
            <div class="quick-label">Ganancia Neta (Bs)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'

// Parámetros configurables
const DAYS = ref(60)
const MEAN_DEMAND = ref(100.0)
const CAPACITY = ref(700)
const semillaInput = ref(null)

// Parámetros fijos
const REVIEW_PERIOD = 7
const ORDER_COST = 100.0
const HOLDING_COST = 0.1
const ACQ_COST = 3.5
const SELL_PRICE = 5.0

// Estado de la simulación
const diasSimulados = ref([])
const totalOrdersPlaced = ref(0)
const totalOrderingCost = ref(0)
const totalAcquisitionCost = ref(0)
const totalHoldingCost = ref(0)
const totalRevenue = ref(0)
const totalLostDemand = ref(0)
const totalDemanda = ref(0)
const totalVendido = ref(0)

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

// Clase para representar pedidos en tránsito
class Order {
  constructor(arrivalDay, qty) {
    this.arrivalDay = arrivalDay
    this.qty = qty
  }
}

// Ejecutar simulación
const ejecutarSimulacion = () => {
  // Reiniciar estado
  diasSimulados.value = []
  totalOrdersPlaced.value = 0
  totalOrderingCost.value = 0
  totalAcquisitionCost.value = 0
  totalHoldingCost.value = 0
  totalRevenue.value = 0
  totalLostDemand.value = 0
  totalDemanda.value = 0
  totalVendido.value = 0

  const rand = semillaInput.value !== null ?
    new JavaRandom(semillaInput.value) : new JavaRandom()

  let inventory = CAPACITY.value // Iniciamos con bodega llena
  const pipeline = []

  for (let day = 1; day <= DAYS.value; day++) {
    // 1) Procesar llegadas del día
    let receivedToday = 0.0
    for (let i = pipeline.length - 1; i >= 0; i--) {
      const order = pipeline[i]
      if (order.arrivalDay === day) {
        receivedToday += order.qty
        totalAcquisitionCost.value += order.qty * ACQ_COST
        pipeline.splice(i, 1)
      }
    }
    inventory += receivedToday

    const inventoryStart = inventory

    // 2) Generar demanda exponencial
    const u = rand.nextDouble()
    let demand = -MEAN_DEMAND.value * Math.log(1.0 - u)
    demand = Math.round(demand * 100.0) / 100.0

    totalDemanda.value += demand

    // 3) Satisfacer demanda (lost sales si no hay suficiente)
    const sold = Math.min(inventory, demand)
    const lost = demand - sold
    inventory -= sold

    totalRevenue.value += sold * SELL_PRICE
    totalVendido.value += sold
    totalLostDemand.value += lost

    // 4) En días de revisión se realiza pedido
    let orderedQty = 0.0
    let pedidoRealizado = false
    let detallePedido = ""
    let pedidosEnTransito = false

    if ((day - 1) % REVIEW_PERIOD === 0) {
      orderedQty = Math.max(0.0, CAPACITY.value - inventory)
      if (orderedQty > 0.0) {
        const lead = Math.floor(rand.nextDouble() * 3) + 1 // 1,2 o 3 días
        const arrival = day + lead
        pipeline.push(new Order(arrival, orderedQty))
        totalOrderingCost.value += ORDER_COST
        totalOrdersPlaced.value++
        pedidoRealizado = true
        detallePedido = `[${arrival}→${orderedQty.toFixed(0)}]`
      } else {
        detallePedido = "-"
      }
    } else {
      // Listar pedidos en tránsito
      if (pipeline.length > 0) {
        pedidosEnTransito = true
        detallePedido = pipeline.map(o => `${o.arrivalDay}:${o.qty.toFixed(0)}`).join(" ")
      } else {
        detallePedido = "-"
      }
    }

    // 5) Costo de mantenimiento
    const holdingCostToday = inventory * HOLDING_COST
    totalHoldingCost.value += holdingCostToday

    // Guardar día simulado
    diasSimulados.value.push({
      dia: day,
      u: u,
      demanda: demand,
      inicio: inventoryStart,
      recepcion: receivedToday,
      vendido: sold,
      perdido: lost,
      fin: inventory,
      pedidoRealizado: pedidoRealizado,
      pedidosEnTransito: pedidosEnTransito,
      detallePedido: detallePedido,
      esDiaRevision: (day - 1) % REVIEW_PERIOD === 0
    })
  }
}

// Estadísticas computadas
const costoTotal = computed(() => {
  return totalOrderingCost.value + totalAcquisitionCost.value + totalHoldingCost.value
})

const gananciaNeta = computed(() => {
  return totalRevenue.value - costoTotal.value
})

const porcentajePerdido = computed(() => {
  return (totalLostDemand.value / totalDemanda.value) * 100.0
})

const promedioDemanda = computed(() => {
  return totalDemanda.value / DAYS.value
})

const evaluacionCapacidad = computed(() => {
  if (totalLostDemand.value === 0) {
    return "La capacidad de " + CAPACITY.value + " kg fue suficiente (no hubo demanda perdida)."
  } else {
    return "La capacidad de " + CAPACITY.value + " kg NO es suficiente: hubo demanda insatisfecha (" +
           totalLostDemand.value.toFixed(2) + " kg total = " + porcentajePerdido.value.toFixed(2) + "% de la demanda)."
  }
})
</script>

<style scoped>
.azucar-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a535c 0%, #4ecdc4 100%);
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
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  align-items: end;
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
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: fit-content;
}

.run-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
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
  font-size: 0.9rem;
}

.header-cell {
  padding: 0 5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-cell.dia { width: 6%; }
.header-cell.rand { width: 8%; }
.header-cell.demanda { width: 10%; }
.header-cell.inicio { width: 10%; }
.header-cell.recepc { width: 8%; }
.header-cell.vend { width: 8%; }
.header-cell.perd { width: 8%; }
.header-cell.fin { width: 8%; }
.header-cell.pedidos { width: 24%; }

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
  font-size: 0.9rem;
}

.result-row:hover {
  background: #f8f9fa;
}

.result-row.dia-revision {
  background: #e8f4fd;
  border-left: 4px solid #3498db;
}

.result-row.con-pedido {
  background: #e8f6f3;
  border-left: 4px solid #27ae60;
}

.cell {
  padding: 0 5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell.dia { width: 6%; font-weight: 600; }
.cell.rand { width: 8%; }
.cell.demanda { width: 10%; }
.cell.inicio { width: 10%; }
.cell.recepc { width: 8%; }
.cell.vend { width: 8%; }
.cell.perd { width: 8%; }
.cell.fin { width: 8%; }
.cell.pedidos { width: 24%; justify-content: flex-start; }

.perdida {
  color: #e74c3c;
  font-weight: 600;
}

.pedido-realizado {
  color: #27ae60;
  font-weight: 600;
}

.pedidos-transito {
  color: #3498db;
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
  margin-bottom: 15px;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

.resumen-item.destacado {
  background: rgba(255, 255, 255, 0.2);
  font-size: 1.1rem;
  font-weight: bold;
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

.evaluacion-capacidad {
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

.evaluacion-capacidad.suficiente {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
  border: 1px solid #2ecc71;
}

.evaluacion-capacidad.insuficiente {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
  border: 1px solid #e74c3c;
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
    grid-template-columns: repeat(2, 1fr);
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
    min-width: 900px;
  }
}

@media (max-width: 480px) {
  .config-panel {
    grid-template-columns: 1fr;
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
</style>
