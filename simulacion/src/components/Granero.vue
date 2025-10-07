<template>
  <div class="granero-container">
    <div class="container">
      <header>
        <h1>Simulación de Granero - Distribución Poisson por Intervalos</h1>
      </header>

      <div class="content">
        <!-- Panel de configuración -->
        <div class="config-panel">
          <div class="config-grid">
            <div class="config-group">
              <label for="dias">Días a simular:</label>
              <input type="number" id="dias" v-model.number="DAYS" min="1" max="1000">
            </div>
            <div class="config-group">
              <label for="mediaPoisson">Media Poisson (λ):</label>
              <input
                type="number"
                id="mediaPoisson"
                v-model.number="mediaPoisson"
                min="0.1"
                max="10"
                step="0.1"
              >
            </div>
            <div class="config-group">
              <label for="decimales">Decimales a considerar:</label>
              <input
                type="number"
                id="decimales"
                v-model.number="decimales"
                min="2"
                max="6"
                step="1"
              >
            </div>
            <div class="config-group">
              <label for="precioHuevo">Precio huevo (Bs):</label>
              <input type="number" id="precioHuevo" v-model.number="PRECIO_HUEVO" min="0" step="0.1">
            </div>
            <div class="config-group">
              <label for="precioPollo">Precio pollo (Bs):</label>
              <input type="number" id="precioPollo" v-model.number="PRECIO_POLLO" min="0" step="1">
            </div>
            <div class="config-group">
              <label for="semilla">Semilla (opcional):</label>
              <input type="number" id="semilla" v-model.number="semilla" placeholder="12345">
            </div>
          </div>

          <!-- Panel de control Poisson -->
          <div class="poisson-control-panel">
            <div class="poisson-control-header">
              <h3> Configuración Distribución Poisson</h3>
              <button @click="calcularIntervalosPoisson" class="calc-btn">
                 Calcular Intervalos Poisson
              </button>
            </div>

            <!-- Información de la distribución -->
            <div class="poisson-info-panel" v-if="infoPoisson.probabilidades.length > 0">
              <div class="poisson-info-header">
                <h4>Distribución Poisson - λ = {{ mediaPoisson }}</h4>
                <div class="poisson-stats">
                  <span>Media teórica: {{ infoPoisson.mediaTeorica.toFixed(4) }}</span>
                  <span>Varianza: {{ infoPoisson.varianza.toFixed(4) }}</span>
                </div>
              </div>

              <div class="poisson-distribucion">
                <div v-for="prob in infoPoisson.probabilidades" :key="prob.k" class="poisson-item">
                  <span class="poisson-k">P(X={{ prob.k }})</span>
                  <span class="poisson-prob">{{ prob.probabilidad.toFixed(6) }}</span>
                  <span class="poisson-percent">({{ prob.porcentaje }})</span>
                  <span class="poisson-acum">Acum: {{ prob.acumulado.toFixed(6) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Editor de Intervalos Poisson -->
          <div class="intervalos-panel">
            <div class="intervalos-header">
              <h3>Intervalos de Distribución Poisson</h3>
              <div class="intervalos-summary">
                <span>Total intervalos: {{ LIMITES.length }}</span>
                <span :class="ultimoLimiteValido ? 'valid' : 'invalid'">
                  {{ ultimoLimiteValido ? ' Valido: 1.00' : ' No Valido 1.00' }}
                </span>
              </div>
            </div>

            <div class="intervalos-grid">
              <div v-for="(limite, index) in LIMITES" :key="index" class="intervalo-item">
                <div class="intervalo-info">
                  <span class="intervalo-label">Intervalo {{ index }}:</span>
                  <span class="intervalo-rango">
                    {{ index === 0 ? '0.00' : formatearDecimal(LIMITES[index - 1]) }}
                      ≤ u <
                      {{ index === LIMITES.length - 1 ? '1.00' : formatearDecimal(limite) }}
                  </span>
                  <span class="intervalo-huevos">→ {{ index }} huevos</span>
                </div>
                <div class="intervalo-control">
                  <label>Límite superior:</label>
                  <input
                    type="number"
                    v-model.number="LIMITES[index]"
                    min="0"
                    max="1"
                    step="0.01"
                    class="intervalo-input"
                    @change="validarIntervalo(index)"
                  >
                </div>
              </div>
            </div>

            <div class="intervalos-controls">
              <button @click="agregarIntervalo" class="add-btn" :disabled="LIMITES.length >= 15">
                 Agregar Intervalo
              </button>
              <button @click="eliminarUltimoIntervalo" class="delete-btn" :disabled="LIMITES.length <= 2">
                 Eliminar Último
              </button>
              <button @click="resetearIntervalos" class="reset-btn">
                Restablecer
              </button>
            </div>
          </div>

          <!-- Probabilidades de Destino EDITABLES -->
          <div class="destinos-panel">
            <div class="destinos-header">
              <h3> Probabilidades de Destino por Huevo</h3>
              <div class="destinos-summary">
                <span>Total: {{ sumaProbDestinos.toFixed(2) }}</span>
                <span :class="sumaProbDestinos === 1 ? 'valid' : 'invalid'">
                  {{ sumaProbDestinos === 1 ? ' Válido' : ' Debe sumar 1.00' }}
                </span>
              </div>
            </div>

            <div class="destinos-grid">
              <div class="destino-item roto">
                <div class="destino-controls">
                  <div class="destino-info">
                    <span class="destino-label">Roto:</span>
                    <span class="destino-rango">
                      {{ formatearDecimal(0) }} ≤ u < {{ formatearDecimal(destinos[0].probabilidad) }}
                    </span>
                  </div>
                  <div class="destino-input-group">
                    <label>Probabilidad:</label>
                    <input
                      type="number"
                      v-model.number="destinos[0].probabilidad"
                      min="0"
                      max="1"
                      step="0.01"
                      class="destino-input"
                      @change="validarProbDestino(0)"
                    >
                    <span class="destino-percent">{{ (destinos[0].probabilidad * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="destino-visual">
                    <div class="destino-bar">
                      <div
                        class="destino-bar-fill roto"
                        :style="{ width: (destinos[0].probabilidad * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="destino-item huevo-vendible">
                <div class="destino-controls">
                  <div class="destino-info">
                    <span class="destino-label">Huevo vendible:</span>
                    <span class="destino-rango">
                      {{ formatearDecimal(destinos[0].probabilidad) }} ≤ u < {{ formatearDecimal(destinos[0].probabilidad + destinos[1].probabilidad) }}
                    </span>
                  </div>
                  <div class="destino-input-group">
                    <label>Probabilidad:</label>
                    <input
                      type="number"
                      v-model.number="destinos[1].probabilidad"
                      min="0"
                      max="1"
                      step="0.01"
                      class="destino-input"
                      @change="validarProbDestino(1)"
                    >
                    <span class="destino-percent">{{ (destinos[1].probabilidad * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="destino-visual">
                    <div class="destino-bar">
                      <div
                        class="destino-bar-fill huevo-vendible"
                        :style="{ width: (destinos[1].probabilidad * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="destino-item pollo">
                <div class="destino-controls">
                  <div class="destino-info">
                    <span class="destino-label">Pollo (muerto o vivo):</span>
                    <span class="destino-rango">
                      {{ formatearDecimal(destinos[0].probabilidad + destinos[1].probabilidad) }} ≤ u < 1.00
                    </span>
                  </div>
                  <div class="destino-input-group">
                    <label>Probabilidad:</label>
                    <input
                      type="number"
                      v-model.number="destinos[2].probabilidad"
                      min="0"
                      max="1"
                      step="0.01"
                      class="destino-input"
                      @change="validarProbDestino(2)"
                      disabled
                    >
                    <span class="destino-percent">{{ (destinos[2].probabilidad * 100).toFixed(0) }}%</span>
                  </div>
                  <div class="destino-visual">
                    <div class="destino-bar">
                      <div
                        class="destino-bar-fill pollo"
                        :style="{ width: (destinos[2].probabilidad * 100) + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Probabilidad para pollo vivo vs muerto -->
              <div class="destino-subpanel">
                <h4>Probabilidad de Pollo Vivo (si es pollo)</h4>
                <div class="pollo-subcontrol">
                  <div class="destino-input-group">
                    <label>P(w < {{ probPolloVivo }}):</label>
                    <input
                      type="number"
                      v-model.number="probPolloVivo"
                      min="0"
                      max="1"
                      step="0.01"
                      class="destino-input"
                    >
                    <span class="destino-percent">{{ (probPolloVivo * 100).toFixed(0) }}% muere</span>
                  </div>
                  <div class="destino-info">
                    <span>Pollo muerto: w < {{ probPolloVivo.toFixed(2) }}</span>
                    <span>Pollo vivo: w ≥ {{ probPolloVivo.toFixed(2) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="destinos-preview">
              <h4>Distribución Acumulada:</h4>
              <div class="preview-distribucion">
                <div class="preview-segmento roto"
                     :style="{ width: (destinos[0].probabilidad * 100) + '%' }"
                     :title="`Roto: ${(destinos[0].probabilidad * 100).toFixed(1)}%`">
                  <span class="preview-text">{{ (destinos[0].probabilidad * 100).toFixed(0) }}%</span>
                </div>
                <div class="preview-segmento huevo-vendible"
                     :style="{ width: (destinos[1].probabilidad * 100) + '%' }"
                     :title="`Huevo vendible: ${(destinos[1].probabilidad * 100).toFixed(1)}%`">
                  <span class="preview-text">{{ (destinos[1].probabilidad * 100).toFixed(0) }}%</span>
                </div>
                <div class="preview-segmento pollo"
                     :style="{ width: (destinos[2].probabilidad * 100) + '%' }"
                     :title="`Pollo: ${(destinos[2].probabilidad * 100).toFixed(1)}%`">
                  <span class="preview-text">{{ (destinos[2].probabilidad * 100).toFixed(0) }}%</span>
                </div>
              </div>
            </div>
          </div>

          <button @click="ejecutarSimulacion" class="run-btn"
                  :disabled="sumaProbDestinos !== 1 || !ultimoLimiteValido">
             Ejecutar Simulación ({{ DAYS }} días)
            <span v-if="sumaProbDestinos !== 1 || !ultimoLimiteValido">
              (Configuración inválida)
            </span>
          </button>
        </div>

        <!-- Resultados -->
        <div class="results-container" v-if="dias.length > 0">
          <div class="results-header">
            <h3>Resultados de la Simulación - {{ DAYS }} días</h3>
          </div>

          <div class="table-wrapper">
            <div class="table-header">
              <div class="header-cell dia">Día</div>
              <div class="header-cell upois">uPois</div>
              <div class="header-cell huevos">Huevos</div>
              <div class="header-cell u-huevos">u / w por huevo</div>
              <div class="header-cell hvend">Hvend</div>
              <div class="header-cell pviv">Pviv</div>
              <div class="header-cell pmuert">Pmuert</div>
              <div class="header-cell ingreso-dia">$Día</div>
              <div class="header-cell ingreso-acum">$Acum</div>
            </div>

            <div class="table-body">
              <div v-for="dia in diasPaginados" :key="dia.numero" class="result-row">
                <div class="cell dia">{{ dia.numero }}</div>
                <div class="cell upois">{{ dia.uPois.toFixed(2) }}</div>
                <div class="cell huevos">{{ dia.huevos }}</div>
                <div class="cell u-huevos" :title="dia.detalle">
                  {{ dia.detalle }}
                </div>
                <div class="cell hvend">{{ dia.huevosVend }}</div>
                <div class="cell pviv">{{ dia.pollosVivos }}</div>
                <div class="cell pmuert">{{ dia.pollosMuertos }}</div>
                <div class="cell ingreso-dia">{{ dia.ingresoDia.toFixed(2) }}</div>
                <div class="cell ingreso-acum">{{ dia.ingresoAcum.toFixed(2) }}</div>
              </div>
            </div>
          </div>

          <!-- Controles de paginación -->
          <div class="pagination-controls">
            <button @click="paginaAnterior" :disabled="pagination.current === 1" class="pag-btn">
              ◀ Anterior
            </button>
            <span class="pag-info">
              Página {{ pagination.current }} de {{ totalPaginas }}
            </span>
            <button @click="paginaSiguiente" :disabled="pagination.current === totalPaginas" class="pag-btn">
              Siguiente ▶
            </button>
            <select v-model="pagination.itemsPerPage" @change="cambiarPagina(1)" class="page-select">
              <option value="10">10 días</option>
              <option value="25">25 días</option>
              <option value="50">50 días</option>
              <option value="100">100 días</option>
            </select>
          </div>
        </div>

        <!-- Resumen Final -->
        <div class="resumen-final" v-if="dias.length > 0">
          <div class="resumen-header">
            <h3> RESUMEN GENERAL</h3>
          </div>
          <div class="resumen-grid">
            <div class="resumen-item">
              <span class="resumen-label">Ingreso total {{ DAYS }} días:</span>
              <span class="resumen-value">${{ ingresoTotal.toFixed(2) }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Promedio diario:</span>
              <span class="resumen-value">${{ ingresoPromedio.toFixed(2) }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Total huevos producidos:</span>
              <span class="resumen-value">{{ totalHuevos }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Total huevos vendidos:</span>
              <span class="resumen-value">{{ totalHuevosVend }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Total pollos vivos:</span>
              <span class="resumen-value">{{ totalPollosVivos }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Total pollos muertos:</span>
              <span class="resumen-value">{{ totalPollosMuertos }}</span>
            </div>
            <div class="resumen-item">
              <span class="resumen-label">Tasa de huevos vendibles:</span>
              <span class="resumen-value">{{ (totalHuevosVend / totalHuevos * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <!-- Estadísticas Rápidas -->
        <div class="quick-stats" v-if="dias.length > 0">
          <div class="quick-stat">
            <div class="quick-value">{{ totalHuevos }}</div>
            <div class="quick-label">Huevos Prod</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ totalHuevosVend }}</div>
            <div class="quick-label">Huevos Vend</div>
          </div>
          <div class="quick-stat">
            <div class="quick-value">{{ totalPollosVivos }}</div>
            <div class="quick-label">Pollos Viv</div>
          </div>
          <div class="quick-stat ingreso">
            <div class="quick-value">${{ ingresoTotal.toFixed(0) }}</div>
            <div class="quick-label">Ingreso Total</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Parámetros configurables
const DAYS = ref(300)
const PRECIO_HUEVO = ref(2.0)
const PRECIO_POLLO = ref(30.0)
const semilla = ref(12345)
const mediaPoisson = ref(1.5)
const decimales = ref(4)
const probPolloVivo = ref(0.3) // Probabilidad de que un pollo muera (w < 0.3)

// Intervalos de distribución Poisson (se calcularán automáticamente)
const LIMITES = ref([0.37, 0.74, 0.91, 0.98, 1.00])

// Destinos editables de los huevos (ahora solo 3 categorías principales)
const destinos = ref([
  { nombre: 'Roto', tipo: 'roto', probabilidad: 0.20 },
  { nombre: 'Huevo vendible', tipo: 'huevo-vendible', probabilidad: 0.56 },
  { nombre: 'Pollo', tipo: 'pollo', probabilidad: 0.24 } // Calculado automáticamente
])

// Estado de la simulación
const dias = ref([])
const pagination = ref({
  current: 1,
  itemsPerPage: 25
})

// Computed properties para validación
const sumaProbDestinos = computed(() => {
  return destinos.value.reduce((sum, dest) => sum + dest.probabilidad, 0)
})

const ultimoLimiteValido = computed(() => {
  return LIMITES.value.length > 0 && Math.abs(LIMITES.value[LIMITES.value.length - 1] - 1.00) < 0.001
})

// Asegurar que la probabilidad de pollo sea 1 - (roto + huevo)
watch([() => destinos.value[0].probabilidad, () => destinos.value[1].probabilidad], () => {
  destinos.value[2].probabilidad = 1 - destinos.value[0].probabilidad - destinos.value[1].probabilidad
  if (destinos.value[2].probabilidad < 0) {
    destinos.value[2].probabilidad = 0
  }
})

// Función para formatear decimales según la configuración
const formatearDecimal = (valor) => {
  return valor.toFixed(decimales.value)
}

// Función para calcular factorial
const factorial = (n) => {
  if (n === 0 || n === 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

// Función para calcular la distribución Poisson
const calcularIntervalosPoisson = () => {
      if (mediaPoisson.value <= 0) {
        alert('La media Poisson debe ser mayor que 0')
        return
      }

      const lambda = mediaPoisson.value
      const intervalos = []
      let acumulado = 0
      let k = 0

      // Calcular probabilidades acumuladas hasta que la suma sea muy cercana a 1
      while (acumulado < 0.9999 && k < 15) {
        const probabilidad = (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
        acumulado += probabilidad

        const limiteRedondeado = parseFloat(acumulado.toFixed(decimales.value))

        // Solo agregar si es menor que 1.00
        if (limiteRedondeado < 1.00) {
          intervalos.push(limiteRedondeado)
        }

        k++
      }

      // Siempre agregar 1.00 como último intervalo
      intervalos.push(1.00)

      LIMITES.value = intervalos
    }

  const lambda = mediaPoisson.value
  const intervalos = []
  let acumulado = 0
  let k = 0

  // Calcular probabilidades acumuladas hasta que la suma sea muy cercana a 1
  while (acumulado < 0.9999 && k < 15) {
    // Fórmula de Poisson: P(X=k) = (e^(-λ) * λ^k) / k!
    const probabilidad = (Math.exp(-lambda) * Math.pow(lambda, k)) / factorial(k)
    acumulado += probabilidad

    // Redondear según el número de decimales especificado
    const limiteRedondeado = parseFloat(acumulado.toFixed(decimales.value))
    intervalos.push(Math.min(limiteRedondeado, 1.0))

    k++
  }

  // Asegurar que el último valor sea exactamente 1.00
  if (intervalos.length > 0) {
    intervalos[intervalos.length - 1] = 1.00
  }

  LIMITES.value = intervalos

// Información de la distribución Poisson calculada
const infoPoisson = computed(() => {
  const lambda = mediaPoisson.value
  const probabilidades = []
  let acumulado = 0
  let mediaCalculada = 0
  let varianzaCalculada = 0

  for (let k = 0; k < LIMITES.value.length; k++) {
    const prob = k === 0 ? LIMITES.value[0] : LIMITES.value[k] - LIMITES.value[k-1]
    acumulado = LIMITES.value[k]

    probabilidades.push({
      k: k,
      probabilidad: prob,
      porcentaje: (prob * 100).toFixed(2) + '%',
      acumulado: acumulado
    })

    // Calcular media y varianza
    mediaCalculada += k * prob
    varianzaCalculada += k * k * prob

    // Detener cuando el acumulado llegue a 1.00
    if (Math.abs(acumulado - 1.00) < 0.0001) {
      break
    }
  }

  varianzaCalculada = varianzaCalculada - (mediaCalculada * mediaCalculada)

  return {
    lambda,
    probabilidades,
    mediaTeorica: mediaCalculada,
    varianza: varianzaCalculada
  }
})

// Métodos para destinos
const validarProbDestino = (index) => {
  if (destinos.value[index].probabilidad < 0) {
    destinos.value[index].probabilidad = 0
  } else if (destinos.value[index].probabilidad > 1) {
    destinos.value[index].probabilidad = 1
  }
}

// Métodos para intervalos

const validarIntervalo = (index) => {
  // Si es el último intervalo, forzar a 1.00 y salir
  if (index === LIMITES.value.length - 1) {
    LIMITES.value[index] = 1.00
    return
  }

  // Validaciones para intervalos que NO son el último
  if (LIMITES.value[index] < 0) {
    LIMITES.value[index] = 0
  } else if (LIMITES.value[index] >= 1.00) {
    // Si un intervalo que no es el último trata de ser 1.00, ponerlo en 0.99
    LIMITES.value[index] = 0.99
  }

  // Validar que el intervalo actual sea mayor que el anterior
  if (index > 0 && LIMITES.value[index] <= LIMITES.value[index - 1]) {
    const nuevoValor = LIMITES.value[index - 1] + 0.01
    LIMITES.value[index] = parseFloat(Math.min(nuevoValor, 0.99).toFixed(decimales.value))
  }

  // Validar que el intervalo actual sea menor que el siguiente
  if (index < LIMITES.value.length - 1 && LIMITES.value[index] >= LIMITES.value[index + 1]) {
    const nuevoValor = LIMITES.value[index + 1] - 0.01
    LIMITES.value[index] = parseFloat(Math.max(nuevoValor, 0).toFixed(decimales.value))
  }

  // Asegurar que el último sea siempre 1.00
  LIMITES.value[LIMITES.value.length - 1] = 1.00
}

const agregarIntervalo = () => {
  if (LIMITES.value.length < 15) {
    // Tomar el penúltimo y último intervalo actual
    const penultimoIndex = LIMITES.value.length - 2
    const penultimoValor = LIMITES.value[penultimoIndex]
    const ultimoValor = LIMITES.value[LIMITES.value.length - 1] // Este es 1.00

    // Calcular nuevo valor entre el penúltimo y 1.00
    let nuevoValor = (penultimoValor + 1.00) / 2

    // Asegurar que no sea 1.00
    if (nuevoValor >= 1.00) {
      nuevoValor = 0.99
    }

    // Insertar antes del último (que es 1.00)
    LIMITES.value.splice(LIMITES.value.length - 1, 0,
      parseFloat(nuevoValor.toFixed(decimales.value))
    )

    // Reordenar todos los intervalos excepto el último
    reordenarIntervalos()
  }
}

const eliminarUltimoIntervalo = () => {
  if (LIMITES.value.length > 2) {
    // Eliminar el penúltimo intervalo (no el último que es 1.00)
    LIMITES.value.splice(LIMITES.value.length - 2, 1)
    // Asegurar que el último sea 1.00
    LIMITES.value[LIMITES.value.length - 1] = 1.00
  }
}

const reordenarIntervalos = () => {
  // Ordenar todos los intervalos excepto el último
  const intervalosSinUltimo = LIMITES.value.slice(0, -1).sort((a, b) => a - b)

  // Agregar el último como 1.00
  LIMITES.value = [...intervalosSinUltimo, 1.00]

  // Aplicar los decimales
  LIMITES.value = LIMITES.value.map(limite =>
    parseFloat(limite.toFixed(decimales.value))
  )
}

const resetearIntervalos = () => {
  LIMITES.value = [0.37, 0.74, 0.91, 0.98, 1.00]
}

// Generador de números aleatorios
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

// Función para obtener huevos según intervalos
const obtenerHuevos = (u) => {
  for (let k = 0; k < LIMITES.value.length; k++) {
    if (u < LIMITES.value[k]) return k
  }
  return LIMITES.value.length - 1
}

// Función para determinar destino del huevo (nueva lógica)
const determinarDestino = (u, rand) => {
  if (u < destinos.value[0].probabilidad) {
    return { tipo: 'roto', nombre: 'Roto' }
  } else if (u < destinos.value[0].probabilidad + destinos.value[1].probabilidad) {
    return { tipo: 'huevo-vendible', nombre: 'Huevo vendible' }
  } else {
    // Es pollo - generar w para determinar si está vivo o muerto
    const w = rand.nextDouble()
    if (w < probPolloVivo.value) {
      return { tipo: 'pollo-muerto', nombre: 'Pollo muerto' }
    } else {
      return { tipo: 'pollo-vivo', nombre: 'Pollo vivo' }
    }
  }
}

// Ejecutar simulación
const ejecutarSimulacion = () => {
  dias.value = []
  const rand = semilla.value !== null ? new JavaRandom(semilla.value) : new JavaRandom()
  let ingresoAcum = 0.0
  let totalHuevosProd = 0
  let totalHuevosVend = 0
  let totalPollosVivos = 0
  let totalPollosMuertos = 0

  for (let d = 1; d <= DAYS.value; d++) {
    // Aleatorio para Poisson
    const uPois = rand.nextDouble()
    const huevos = obtenerHuevos(uPois)

    let huevosVend = 0
    let pollosVivos = 0
    let pollosMuertos = 0
    const detalleArray = []

    // Procesar cada huevo
    for (let i = 0; i < huevos; i++) {
      const u = rand.nextDouble()
      let detalleHuevo = u.toFixed(2)

      // Determinar destino usando la nueva lógica
      const destino = determinarDestino(u, rand)

      switch (destino.tipo) {
        case 'roto':
          // No hace nada, solo registra
          break
        case 'huevo-vendible':
          huevosVend++
          totalHuevosVend++
          break
        case 'pollo-muerto':
          pollosMuertos++
          totalPollosMuertos++
          // Para pollos, agregar w al detalle
          detalleHuevo += "/" + (probPolloVivo.value - 0.01).toFixed(2) // Simular w < probPolloVivo
          break
        case 'pollo-vivo':
          pollosVivos++
          totalPollosVivos++
          // Para pollos, agregar w al detalle
          detalleHuevo += "/" + (probPolloVivo.value + 0.01).toFixed(2) // Simular w >= probPolloVivo
          break
      }

      detalleArray.push(detalleHuevo)
    }

    const ingresoDia = huevosVend * PRECIO_HUEVO.value + pollosVivos * PRECIO_POLLO.value
    ingresoAcum += ingresoDia

    // Acumular totales
    totalHuevosProd += huevos

    dias.value.push({
      numero: d,
      uPois: uPois,
      huevos: huevos,
      detalle: detalleArray.join(' '),
      huevosVend: huevosVend,
      pollosVivos: pollosVivos,
      pollosMuertos: pollosMuertos,
      ingresoDia: ingresoDia,
      ingresoAcum: ingresoAcum
    })
  }
}

// Paginación y estadísticas
const diasPaginados = computed(() => {
  const start = (pagination.value.current - 1) * pagination.value.itemsPerPage
  const end = start + parseInt(pagination.value.itemsPerPage)
  return dias.value.slice(start, end)
})

const totalPaginas = computed(() => {
  return Math.ceil(dias.value.length / pagination.value.itemsPerPage)
})

const paginaAnterior = () => {
  if (pagination.value.current > 1) {
    pagination.value.current--
  }
}

const paginaSiguiente = () => {
  if (pagination.value.current < totalPaginas.value) {
    pagination.value.current++
  }
}

const cambiarPagina = (pagina) => {
  pagination.value.current = pagina
}

const ingresoTotal = computed(() => {
  return dias.value.length > 0 ? dias.value[dias.value.length - 1].ingresoAcum : 0
})

const ingresoPromedio = computed(() => {
  return dias.value.length > 0 ? ingresoTotal.value / dias.value.length : 0
})

const totalHuevos = computed(() => {
  return dias.value.reduce((sum, dia) => sum + dia.huevos, 0)
})

const totalHuevosVend = computed(() => {
  return dias.value.reduce((sum, dia) => sum + dia.huevosVend, 0)
})

const totalPollosVivos = computed(() => {
  return dias.value.reduce((sum, dia) => sum + dia.pollosVivos, 0)
})

const totalPollosMuertos = computed(() => {
  return dias.value.reduce((sum, dia) => sum + dia.pollosMuertos, 0)
})

// Calcular intervalos automáticamente al cargar el componente
calcularIntervalosPoisson()
</script>

<style scoped>
/* Estilos anteriores se mantienen, solo agregamos algunos específicos */
.poisson-control-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin: 20px 0;
}

.poisson-control-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 2px solid #9b59b6;
}

.poisson-control-header h3 {
  margin: 0;
  color: #2c3e50;
}

.calc-btn {
  background: #9b59b6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.calc-btn:hover {
  background: #8e44ad;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.poisson-info-panel {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-top: 15px;
}

.poisson-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #ddd;
}

.poisson-info-header h4 {
  margin: 0;
  color: #2c3e50;
}

.poisson-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-size: 0.9rem;
  color: #7f8c8d;
  font-weight: 600;
}

.poisson-distribucion {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 10px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.poisson-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  border-left: 3px solid #9b59b6;
  font-size: 0.85rem;
}

.poisson-k {
  font-weight: 600;
  color: #2c3e50;
  min-width: 60px;
}

.poisson-prob {
  font-family: 'Courier New', monospace;
  color: #e67e22;
  min-width: 100px;
  text-align: right;
}

.poisson-percent {
  color: #27ae60;
  min-width: 60px;
  text-align: center;
  font-weight: 600;
}

.poisson-acum {
  font-family: 'Courier New', monospace;
  color: #3498db;
  min-width: 100px;
  text-align: right;
  font-size: 0.8rem;
}

/* Estilos responsivos */
@media (max-width: 768px) {
  .poisson-control-header {
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
  }

  .poisson-info-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .poisson-stats {
    align-items: flex-start;
  }

  .poisson-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }

  .poisson-k,
  .poisson-prob,
  .poisson-percent,
  .poisson-acum {
    min-width: auto;
    text-align: left;
  }
}

/* Estilos existentes se mantienen igual */
.granero-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #8e44ad 0%, #3498db 100%);
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

.content {
  padding: 25px;
}

.config-panel {
  background: #f8f9fa;
  padding: 25px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin-bottom: 25px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
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

.intervalos-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin: 20px 0;
}

.intervalos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3498db;
}

.intervalos-header h3 {
  margin: 0;
  color: #2c3e50;
}

.intervalos-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-weight: 600;
}

.intervalos-summary .valid {
  color: #27ae60;
}

.intervalos-summary .invalid {
  color: #e74c3c;
}

.intervalos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.intervalo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.intervalo-info {
  flex: 1;
}

.intervalo-label {
  font-weight: 600;
  color: #2c3e50;
  display: block;
  margin-bottom: 5px;
}

.intervalo-rango {
  font-family: 'Courier New', monospace;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.intervalo-huevos {
  font-weight: 600;
  color: #e67e22;
  margin-left: 10px;
}

.intervalo-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.intervalo-control label {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
}

.intervalo-input {
  width: 80px;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.intervalos-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.add-btn, .delete-btn, .reset-btn {
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

.add-btn:hover:not(:disabled) {
  background: #229954;
}

.add-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #c0392b;
}

.delete-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.reset-btn {
  background: #3498db;
  color: white;
}

.reset-btn:hover {
  background: #2980b9;
}

.destinos-panel {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #e9ecef;
  margin: 20px 0;
}

.destinos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3498db;
}

.destinos-header h3 {
  margin: 0;
  color: #2c3e50;
}

.destinos-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  font-weight: 600;
}

.destinos-summary .valid {
  color: #27ae60;
}

.destinos-summary .invalid {
  color: #e74c3c;
}

.destinos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.destino-item {
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.destino-item.roto {
  background: #fef9e7;
  border-left: 4px solid #f39c12;
}

.destino-item.huevo-vendible {
  background: #e8f6f3;
  border-left: 4px solid #27ae60;
}

.destino-item.pollo-muerto {
  background: #fdedec;
  border-left: 4px solid #e74c3c;
}

.destino-item.pollo-vendible {
  background: #e8f4fc;
  border-left: 4px solid #3498db;
}

.destino-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.destino-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.destino-label {
  font-weight: 600;
  color: #2c3e50;
}

.destino-rango {
  font-family: 'Courier New', monospace;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.destino-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.destino-input-group label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 100px;
}

.destino-input {
  width: 80px;
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-weight: 600;
}

.destino-input:focus {
  outline: none;
  border-color: #3498db;
}

.destino-percent {
  font-weight: 600;
  color: #7f8c8d;
  min-width: 40px;
}

.destino-visual {
  flex: 1;
}

.destino-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.destino-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.destino-bar-fill.roto {
  background: #f39c12;
}

.destino-bar-fill.huevo-vendible {
  background: #27ae60;
}

.destino-bar-fill.pollo-muerto {
  background: #e74c3c;
}

.destino-bar-fill.pollo-vendible {
  background: #3498db;
}

.destinos-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.destinos-preview h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.preview-distribucion {
  display: flex;
  height: 30px;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #34495e;
}

.preview-segmento {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.3s ease;
  position: relative;
}

.preview-segmento.roto {
  background: #f39c12;
}

.preview-segmento.huevo-vendible {
  background: #27ae60;
}

.preview-segmento.pollo-muerto {
  background: #e74c3c;
}

.preview-segmento.pollo-vendible {
  background: #3498db;
}

.preview-text {
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-header h3 {
  margin: 0;
}

.results-info {
  font-size: 0.9rem;
  opacity: 0.9;
}

.table-wrapper {
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 6% 8% 8% 30% 8% 8% 10% 12%;
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
  grid-template-columns: 6% 8% 8% 30% 8% 8% 10% 12%;
  padding: 10px 15px;
  border-bottom: 1px solid #ecf0f1;
  transition: background-color 0.2s ease;
  font-size: 0.9rem;
}

.result-row:hover {
  background: #f8f9fa;
}

.cell {
  padding: 0 5px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Courier New', monospace;
}

.cell.u-huevos {
  justify-content: flex-start;
  text-align: left;
  font-size: 0.8rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.pag-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.pag-btn:hover:not(:disabled) {
  background: #2980b9;
}

.pag-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.pag-info {
  font-weight: 600;
  color: #2c3e50;
}

.page-select {
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 6px;
  background: white;
}

.resumen-final {
  background: linear-gradient(135deg, #34495e, #2c3e50);
  color: white;
  padding: 25px;
  border-radius: 10px;
  margin-bottom: 25px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.resumen-header {
  text-align: center;
  margin-bottom: 25px;
  padding-bottom: 15px;
  border-bottom: 2px solid #3498db;
}

.resumen-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 15px;
}

.resumen-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.resumen-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.resumen-label {
  font-weight: 600;
  font-size: 0.95rem;
  color: #ecf0f1;
  flex: 1;
}

.resumen-value {
  font-weight: bold;
  font-family: 'Courier New', monospace;
  font-size: 1.1rem;
  margin-left: 15px;
  color: #2ecc71;
  background: rgba(0, 0, 0, 0.3);
  padding: 5px 12px;
  border-radius: 6px;
  min-width: 100px;
  text-align: center;
  border: 1px solid rgba(46, 204, 113, 0.3);
}

.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.quick-stat {
  background: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  border: 2px solid #e9ecef;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-stat:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.quick-stat.ingreso {
  background: linear-gradient(135deg, #ffeaa7, #fab1a0);
  border-color: #e67e22;
}

.quick-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 8px;
  font-family: 'Courier New', monospace;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.quick-stat.ingreso .quick-value {
  color: #e74c3c;
  font-size: 2.2rem;
}

.quick-label {
  font-size: 0.8rem;
  color: #7f8c8d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.quick-stat.ingreso .quick-label {
  color: #c0392b;
  font-weight: 700;
}

  .quick-value {
    font-size: 1.6rem;
  }

  .quick-stat.ingreso .quick-value {
    font-size: 1.8rem;
  }

.destino-subpanel {
  grid-column: 1 / -1;
  background: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  margin-top: 10px;
}

.destino-subpanel h4 {
  margin: 0 0 10px 0;
  color: #2c3e50;
}

.pollo-subcontrol {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.pollo-subcontrol .destino-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.9rem;
  color: #7f8c8d;
}

/* Ajustes para la tabla de resultados */
.table-header,
.result-row {
  grid-template-columns: 6% 8% 8% 30% 8% 8% 8% 10% 10%;
}

.header-cell.pviv,
.cell.pviv,
.header-cell.pmuert,
.cell.pmuert {
  text-align: center;
}

/* Colores para los tipos de destino */
.destino-item.pollo {
  background: #e8f4fc;
  border-left: 4px solid #3498db;
}

.destino-bar-fill.pollo {
  background: #3498db;
}

.preview-segmento.pollo {
  background: #3498db;
}

/* Resto de estilos se mantienen igual */
/* ... (todos los estilos anteriores permanecen) ... */

</style>
