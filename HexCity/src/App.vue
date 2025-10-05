<template>
  <div id="map" style="width: 100%; height: 100vh"></div>

  <div v-if="selectedHexagon" :class="['hexagon-details-widget', { 'open': isDetailsVisible }]">
    <div class="widget-header">
      <h4>Оценка района (Гексагон #{{ selectedHexagon.id || 'N/A' }})</h4>
      <button @click="closeWidget" class="close-btn">&times;</button>
    </div>

    <div class="metrics-list">
      
      <div class="metric-item group-title">Транспорт и Доступность</div>
      <div class="metric-item">
        <span class="metric-label">Ср. скорость трафика:</span>
        <span class="metric-value">{{ (selectedHexagon.avg_speed || 0).toFixed(1) }} км/ч</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Ср. ограничение скорости:</span>
        <span class="metric-value">{{ (selectedHexagon.avg_limit || 0).toFixed(1) }} км/ч</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Кол-во остановок ОТ:</span>
        <span class="metric-value">{{ selectedHexagon.stop_count || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Уникальных маршрутов:</span>
        <span class="metric-value">{{ selectedHexagon.unique_routes_count || 0 }}</span>
      </div>

      <div class="metric-item group-title">Инфраструктура и Комфорт</div>
      <div class="metric-item">
        <span class="metric-label">Кол-во парков:</span>
        <span class="metric-value">{{ selectedHexagon.count_parks || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Кол-во школ:</span>
        <span class="metric-value">{{ selectedHexagon.count_schools || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Кол-во больниц:</span>
        <span class="metric-value">{{ selectedHexagon.count_hospitals || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Кол-во магазинов:</span>
        <span class="metric-value">{{ selectedHexagon.count_shops || 0 }}</span>
      </div>
      <div class="metric-item">
        <span class="metric-label">Кол-во заводов:</span>
        <span class="metric-value">{{ selectedHexagon.count_factories || 0 }}</span>
      </div>
      
    </div>
  </div>
  
  <div v-if="selectedHexagonId" class="info-widget">
    <h3>Параметры Гексагона #{{ selectedHexagonId }}</h3>
    
    <div v-if="isFetchingRating">
      Загрузка рейтинга...
    </div>
    <div v-else-if="hexagonRating !== null">
      🏆 **Рейтинг:** <strong style="font-size: 1.2em; color: green;">{{ hexagonRating.toFixed(2) }}</strong>
    </div>
    <div v-else>
      Рейтинг не получен. Проверьте консоль или бэкенд.
    </div>
  </div>
  <div class="legend-container">
    <button @click="toggleLegend" class="legend-toggle-btn" title="Как оцениваются районы">?</button>
    
    <div class="custom-tooltip">Как оцениваются районы</div>

    <div :class="['legend-widget', { 'open': showLegend }]">
      <h4>Характеристики районов</h4>
      <div class="legend-item">
        <span class="color-box red"></span>
        <span>Низкий рейтинг</span>
      </div>
      <div class="legend-item">
        <span class="color-box orange"></span>
        <span>Средний рейтинг</span>
      </div>
      <div class="legend-item">
        <span class="color-box blue"></span>
        <span>Высокий рейтинг</span>
      </div>
      <p class="mt-2">
        Это шкала, отражающая общую привлекательность района по нескольким параметрам.
      </p>
    </div>
  </div>

  <div class="personal-params-container">
    <button @click="toggleParameters" class="params-toggle-btn">
      Персональные параметры
    </button>

    <div :class="['params-widget', { 'open': showParameters }]">
      <h4>Мои параметры</h4>
      <div v-for="(items, category) in personalParameters" :key="category" class="category-group">
        <h5>{{ category }}</h5>
        <ul>
          <li v-for="item in items" :key="item.label">
            <label class="custom-checkbox-label">
              <input type="checkbox" v-model="item.checked">
              <span class="checkmark"></span>
              {{ item.label }}
            </label>
          </li>
        </ul>
      </div>
    </div>
  </div>


  <div class="bottom-left-controls">
    <div class="zoom-controls-group">
      <button @click="zoomIn" class="map-zoom-btn zoom-btn-primary">+</button>
      <button @click="zoomOut" class="map-zoom-btn zoom-btn-primary">-</button> 
    </div>

    <div class="scale-indicator-box">
      {{ formatZoomToDistance(currentZoom) }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { load } from '@2gis/mapgl';
// @ts-ignore
import DG from "2gis-maps"; 

const initialZoom = 13; 
const mapInstance = ref<any | null>(null);
const mapglInstance = ref<any | null>(null);
const showLegend = ref(false); 
const selectedHexagon = ref<any | null>(null); 
const isDetailsVisible = ref(false); 

// Store references to polygons, markers and their data for color updates
const hexagonData = ref<{[key: string]: any}>({}); // key: hexId, value: polygon data
const hexagonPolygons = ref<{[key: string]: any}>({}); // key: hexId, value: polygon object
const hexagonMarkers = ref<{[key: string]: any}>({}); // key: hexId, value: marker object

// Новые реактивные переменные для данных виджета
const selectedHexagonId = ref<number | null>(null); // ID выбранного гексагона
const hexagonRating = ref<number | null>(null);    // Рейтинг
const isFetchingRating = ref(false);               // Состояние загрузки

// ⭐ ОБНОВЛЕНО: Поле 'param' соответствует именам флагов бэкенда
const personalParameters = ref({
  "Режим застройщика": [ // НОВЫЙ ПАРАМЕТР
    { label: 'Режим застройщика', checked: false, param: 'builder_flg' },
  ],
  Дети: [
    { label: 'Наличие детей', checked: false, param: 'parent_flg' }, 
  ],
  Питомцы: [
    { label: 'Наличие питомцев', checked: false, param: 'pet_owner_flg' }, 
  ],
  "Личный Транспорт": [ 
    { label: 'Водитель автомобиля', checked: false, param: 'driver_flg' },
  ],
  'Общественный Транспорт': [ 
    // Поскольку бэкенд ожидает один флаг 'uses_public_transport_flg', 
    // для простоты объединим все опции под один флаг в параметрах запроса
    { label: 'Использую общественный транспорт', checked: false, param: 'uses_public_transport_flg' },
    // Старые детализированные флажки (Автобусы, Трамваи, Метро, Троллейбусы) удалены или объединены
  ],
  Семья: [
    { label: 'Большая семья', checked: false, param: 'big_family_flg' },
    { label: 'Пожилые родственники', checked: false, param: 'old_family_flg' },
  ]
});

const closeWidget = () => {
  isDetailsVisible.value = false;
  setTimeout(() => {
    selectedHexagon.value = null;
  }, 300); // 300ms соответствует CSS-переходу
};

const closeHexagonDetails = () => {
  isDetailsVisible.value = false;
  setTimeout(() => {
    selectedHexagon.value = null;
  }, 300); // 300ms соответствует CSS-переходу
};


const showParameters = ref(false); 
const toggleParameters = () => {
  showParameters.value = !showParameters.value;
};

// Переменные и функции для масштаба
const currentZoom = ref(initialZoom); 
const formatZoomToDistance = (zoom: number): string => {
  const distances: { [key: number]: string } = {
    1: '16,000 км', 2: '8,000 км', 3: '4,000 км', 4: '2,000 км', 5: '1,000 км',
    6: '500 км', 7: '250 км', 8: '120 км', 9: '60 км', 10: '30 км',
    11: '15 км', 12: '8 км', 13: '4 км', 14: '2 км', 15: '1 км',
    16: '500 м', 17: '250 м', 18: '100 м', 19: '50 м', 20: '25 м',
  };
  
  let distance: string;
  const roundedZoom = Math.round(zoom);

  if (roundedZoom >= 20) {
      distance = distances[20];
  } else if (roundedZoom <= 1) {
      distance = distances[1];
  } else {
      distance = distances[roundedZoom] || '4 км';
  }
  
  return distance; 
};

const zoomIn = () => {
  if (mapInstance.value) {
    mapInstance.value.setZoom(mapInstance.value.getZoom() + 1); 
  }
};

const zoomOut = () => {
  if (mapInstance.value) {
    mapInstance.value.setZoom(mapInstance.value.getZoom() - 1); 
  }
};

const toggleLegend = () => {
  // If hexagon details widget is open, close it smoothly
  if (isDetailsVisible.value && selectedHexagon.value) {
    closeHexagonDetails();
  }
  
  showLegend.value = !showLegend.value;
};

// Function to determine color based on rating
const getHexagonColorByRating = (rating: number | null): string => {
  if (rating === null) return '#998080aa';
  
  if (rating < 20000) {
    return '#d9534faa'; // Red for low rating
  } else if (rating >= 20000 && rating < 60000) {
    return '#f0ad4eaa'; // Orange for medium rating
  } else {
    return '#20bdc87e'; // Blue for high rating
  }
};

// Function to update polygon color
const updateHexagonColor = (hexId: string, color: string) => {
  const data = hexagonData.value[hexId];
  if (data && mapInstance.value && mapglInstance.value) {
    const polygonCoords = data["peaks"];
    const centerCoords = data["center"];
    
    // Логика замыкания координат для Polygon
    if (
      polygonCoords.length &&
      (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
      polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])
    ) {
      polygonCoords.push(polygonCoords[0]);
    }
    
    // Remove the old polygon and marker
    if (hexagonPolygons.value[hexId]) {
      hexagonPolygons.value[hexId].destroy();
    }
    if (hexagonMarkers.value[hexId]) {
      hexagonMarkers.value[hexId].destroy();
    }
    
    // Create a new polygon with the updated color
    const newPolygon = new mapglInstance.value.Polygon(mapInstance.value, {
      coordinates: [polygonCoords],
      color: color,
      strokeWidth: 1,
      strokeColor: '#35ba24ff',
    });
    
    // Create a new marker
    const newMarker = new mapglInstance.value.Marker(mapInstance.value, {
      coordinates: centerCoords
    });
    
    // Store the new references
    hexagonPolygons.value[hexId] = newPolygon;
    hexagonMarkers.value[hexId] = newMarker;
    
    // Attach the click event listener to the new marker
    newMarker.on('click', (e) => {
      fetchHexagonRating(Number(hexId));
      showLegend.value = false;
      selectedHexagon.value = { ...data, id: hexId }; 
      setTimeout(() => {
          isDetailsVisible.value = true;
      }, 50);
    });
  }
};

async function fetchHexagonRating(hexagonId: number) {
  isFetchingRating.value = true;
  selectedHexagonId.value = hexagonId;
  hexagonRating.value = null; 

  const urlParams = new URLSearchParams();

  for (const category in personalParameters.value) {
    const items = personalParameters.value[category as keyof typeof personalParameters.value]; 
    
    items.forEach(item => {
      if (item.checked) {
        urlParams.append(item.param, 'True'); 
      }
    });
  }
  
  const paramsString = urlParams.toString().length > 0 ? `?${urlParams.toString()}` : '';

  const url = `http://127.0.0.1:8000/hexagons/${hexagonId}/metrics${paramsString}`;
  console.log('Отправка GET-запроса на URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    // 4. Обрабатываем ответ
    if (data && typeof data.rating === 'number') {
      hexagonRating.value = data.rating;
      
      // Update the hexagon color based on the rating
      const color = getHexagonColorByRating(data.rating);
      updateHexagonColor(hexagonId.toString(), color);
    } else {
      console.error('Неверный формат ответа:', data);
      hexagonRating.value = null; 
    }
  } catch (error) {
    console.error('Ошибка при получении рейтинга:', error);
    hexagonRating.value = null;
  } finally {
    isFetchingRating.value = false;
  }
}

async function loadAndDrawPolygons(map, mapgl) {
  try {
    const response = await fetch('./moscow_hexagons_with_POI_final.json');
    const hexagons = await response.json();

    Object.entries(hexagons).forEach(([hexId, hexData]) => {
      // @ts-ignore
      const data = hexData; 
      const polygonCoords = data["peaks"];
      const centerCoords = data["center"];
      
      // Логика замыкания координат для Polygon
      if (
        polygonCoords.length &&
        (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
        polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])
      ) {
        polygonCoords.push(polygonCoords[0]);
      }

      const polygon = new mapgl.Polygon(map, {
        coordinates: [polygonCoords],
        color: '#998080aa', // Цвет гексагона (серый по умолчанию)
        strokeWidth: 1,
        strokeColor: '#35ba24ff', // Цвет обводки
      });
      
      const marker = new mapgl.Marker(map, {
        coordinates: centerCoords
      });
      
      // Store references to polygon, marker and data for later color updates
      hexagonPolygons.value[hexId] = polygon;
      hexagonMarkers.value[hexId] = marker;
      hexagonData.value[hexId] = data;
      
      marker.on('click', (e) => {
        fetchHexagonRating(Number(hexId));
        // Убеждаемся, что легенда закрывается плавн
        showLegend.value = false;
        
        // ⭐ ИЗМЕНЕНИЕ: Сначала устанавливаем данные, затем включаем флаг для плавного появления
        selectedHexagon.value = { ...data, id: hexId }; 
        setTimeout(() => {
            isDetailsVisible.value = true;
        }, 50); // Небольшая задержка для срабатывания CSS-перехода
      });
    });
  } catch (error) {
    console.error('Ошибка при загрузке или отрисовке:', error);
  }
}

onMounted(() => {
  load().then(mapgl => {
    const map = new mapgl.Map("map", {
      center: [37.618423, 55.751244], 
      zoom: initialZoom,
      key: import.meta.env.VITE_2GIS_API_KEY,
      
      zoomControl: false, 
      scaleControl: false, 
      fullscreenControl: false, 
    });

    mapInstance.value = map;
    mapglInstance.value = mapgl;
    
    loadAndDrawPolygons(map, mapgl);
    
    map.on('zoom', () => {
      currentZoom.value = map.getZoom();
    });
  });
})
</script>

---

<style>
/* --- ГЛОБАЛЬНЫЕ ИСПРАВЛЕНИЯ СКРОЛЛА --- */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  font-family: 'Roboto', sans-serif;
  overflow: hidden; 
}

/* --- СТИЛИ ВИДЖЕТА РЕЙТИНГА (НОВЫЙ) --- */
.info-widget {
  position: absolute; 
  top: 10px; 
  right: 370px; /* Сдвиг, чтобы не перекрывал Params-Widget */
  z-index: 1000;
  background: white; 
  padding: 15px; 
  border-radius: 8px; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  width: 250px;
}

.info-widget h3 {
  margin-top: 0;
  font-size: 16px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
  margin-bottom: 10px;
}


/* --- СТИЛИ ПЕРСОНАЛЬНЫХ ПАРАМЕТРОВ (ПРАВЫЙ ВЕРХНИЙ УГОЛ) --- */

.personal-params-container {
  position: absolute;
  top: 10px; 
  right: 10px; 
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end; 
}

.params-toggle-btn {
  padding: 10px 15px;
  background-color: #007bff; 
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
  transition: background-color 0.2s;
  white-space: nowrap; 
}

.params-toggle-btn:hover {
  background-color: #0056b3;
}

.params-widget {
  width: 300px; 
  padding: 0 15px; 
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  line-height: 1.5;
  overflow: hidden; 
  max-height: 0; 
  opacity: 0;
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out, padding 0.4s;
  overflow-y: auto; 
}

.params-widget.open {
  max-height: 500px; 
  opacity: 1;
  padding: 15px; 
}

.params-widget h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.params-widget h5 {
  margin-top: 10px;
  margin-bottom: 5px;
  color: #555;
  font-size: 14px;
  font-weight: 600;
}

.params-widget ul {
  list-style: none;
  padding: 0;
  margin-bottom: 10px;
}

.params-widget li {
  margin-bottom: 5px;
}

/* Стилизация кастомного чек-бокса */
.custom-checkbox-label {
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 25px; 
  cursor: pointer;
  font-size: 14px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

.custom-checkbox-label input {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;
}

.checkmark {
  position: absolute;
  top: 0;
  left: 0;
  height: 16px;
  width: 16px;
  background-color: #eee;
  border: 1px solid #ccc;
  border-radius: 3px;
}

.custom-checkbox-label:hover input ~ .checkmark {
  background-color: #ccc;
}

.custom-checkbox-label input:checked ~ .checkmark {
  background-color: #007bff;
  border-color: #007bff;
}

/* Создание галочки */
.checkmark:after {
  content: "";
  position: absolute;
  display: none;
}

.custom-checkbox-label input:checked ~ .checkmark:after {
  display: block;
}

.custom-checkbox-label .checkmark:after {
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 3px 3px 0;
  -webkit-transform: rotate(45deg);
  -ms-transform: rotate(45deg);
  transform: rotate(45deg);
}

/* --- СТИЛИ ДЛЯ ЛЕГЕНДЫ И КНОПКИ '?' (ЛЕВЫЙ ВЕРХНИЙ УГОЛ) --- */

.legend-container {
  position: absolute;
  top: 10px; 
  left: 10px; 
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start; 
}

/* СТИЛИ КАСТОМНОЙ ПОДСКАЗКИ (TOOLTIP) */
.custom-tooltip {
  position: absolute;
  top: 0; 
  left: 60px; 
  
  background-color: #333;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  white-space: nowrap; 
  z-index: 1001; 
  
  font-size: 14px; 
  font-weight: 500;
  
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s ease-in-out; 
}

/* ПОКАЗАТЬ ПРИ НАВЕДЕНИИ */
.legend-container:hover .custom-tooltip {
  opacity: 1;
  visibility: visible;
}


.legend-toggle-btn {
  width: 40px;
  height: 40px;
  background-color: #ffffff;
  color: #007bff;
  border: 1px solid #ccc;
  border-radius: 50%; 
  font-size: 20px;
  font-weight: bold;
  line-height: 40px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  margin-bottom: 10px;
  transition: background-color 0.2s;
}

.legend-toggle-btn:hover {
  background-color: #f0f0f0;
}

.legend-widget {
  width: 250px;
  padding: 0 15px; 
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  line-height: 1.5;
  overflow: hidden; 
  max-height: 0; 
  opacity: 0;
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out, padding 0.4s;
}

.legend-widget.open {
  max-height: 300px; 
  opacity: 1;
  padding: 15px; 
}

.legend-widget h4, .legend-widget .legend-item, .legend-widget p {
  opacity: 0;
}
.legend-widget.open h4, .legend-widget.open .legend-item, .legend-widget.open p {
  opacity: 1;
  transition: opacity 0.4s 0.2s; 
}

.legend-widget h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}

.legend-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.color-box {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  margin-right: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.color-box.red { background-color: #d9534faa; } 
.color-box.orange { background-color: #f0ad4eaa; } 
.color-box.blue { background-color: #20bdc87e; } 

/* --- КОНТРОЛЫ МАСШТАБА (ЛЕВЫЙ НИЖНИЙ УГОЛ) --- */
.bottom-left-controls {
    position: absolute;
    bottom: 20px; 
    left: 10px;  
    z-index: 1000;
    display: flex;
    flex-direction: column; 
    align-items: flex-start;
}

.zoom-controls-group {
    display: flex;
    flex-direction: column;
    align-items: center; 
    margin-bottom: 8px; 
    padding-left: 0; 
}

.map-zoom-btn {
  width: 50px; 
  height: 50px;
  margin-top: 8px; 
  cursor: pointer;
  font-size: 32px; 
  line-height: 48px; 
  border-radius: 10px; 
  font-weight: 400; 
  transition: all 0.2s;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2); 
  text-align: center;
  padding: 0;
  border-width: 2px;
}

.zoom-btn-primary {
  background-color: #007bff; 
  color: #ffffff; 
  border-style: solid; 
  border-color: #007bff; 
}

.zoom-btn-primary:hover {
  background-color: #0056b3;
  border-color: #0056b3;
}

.scale-indicator-box {
  width: 100px; 
  padding: 5px 0; 
  background-color: #ffffff;
  color: #333;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  font-size: 16px; 
  text-align: center; 
  font-weight: bold;
}

.hexagon-details-widget {
  position: absolute;
  top: 60px; 
  left: 10px;
  z-index: 1000;
  width: 300px; 
  padding: 15px; 
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
  font-size: 14px;
  
  /* ⭐ НОВОЕ: Начальное состояние для плавного появления/исчезновения */
  opacity: 0;
  transform: translateX(-10px); 
  transition: opacity 0.3s ease-out, transform 0.3s ease-out; 
}

/* ⭐ НОВОЕ: Состояние открытия */
.hexagon-details-widget.open {
  opacity: 1;
  transform: translateX(0);
}


.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.widget-header h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  font-weight: 300;
  line-height: 1;
  color: #999;
  cursor: pointer;
  padding: 0 5px;
}

.close-btn:hover {
  color: #333;
}

.metrics-list {
  padding-top: 5px;
}

.group-title {
    font-weight: bold;
    color: #007bff;
    padding-top: 10px !important;
    padding-bottom: 4px !important;
    border-bottom: 1px solid #cce5ff !important;
    margin-top: 5px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #f0f0f0;
}

.total-score-row {
    margin-top: 10px;
    padding-top: 10px !important;
    border-top: 2px solid #333 !important; 
    border-bottom: none !important;
}

.metric-label {
  color: #555;
  font-weight: 400;
}

.metric-value {
  color: #007bff;
  font-weight: 600;
}

.metric-value.final-score {
  color: #5cb85c;
  font-size: 16px;
  font-weight: bold;
}
</style>