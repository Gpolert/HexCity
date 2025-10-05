<template>
  <div id="map" style="width: 100%; height: 100vh"></div>
  
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
        <span class="color-box green"></span>
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
const showLegend = ref(false); 

// ⭐ Категория "Досуг" удалена
const personalParameters = ref({
  Дети: [
    { label: 'Дети', checked: false },
  ],
  Питомцы: [
    { label: 'Наличие питомцев', checked: false },
  ],
  "Личный Транспорт": [ 
    { label: 'Автомобиль', checked: false },
  ],
  'Общественный Транспорт': [ 
    { label: 'Автобусы', checked: false },
    { label: 'Трамваи', checked: false },
    { label: 'Метро', checked: false },
    { label: 'Троллейбусы', checked: false },
  ],
  Семья: [
    { label: 'Большая семья', checked: false },
    { label: 'Пожилые родственники', checked: false },
  ]
});


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
  showLegend.value = !showLegend.value;
};

async function loadAndDrawPolygons(map, mapgl) {
  try {
    const response = await fetch('./moscow_hexagons2 copy.json');
    const hexagons = await response.json();

    hexagons.forEach(coords => {
      const polygonCoords = coords;

      if (
        polygonCoords.length &&
        (polygonCoords[0][0] !== polygonCoords[polygonCoords.length - 1][0] ||
        polygonCoords[0][1] !== polygonCoords[polygonCoords.length - 1][1])
      ) {
        polygonCoords.push(polygonCoords[0]);
      }

      const polygon = new mapgl.Polygon(map, {
        coordinates: [polygonCoords],
        color: '#998080aa',
        strokeWidth: 1,
        strokeColor: '#35ba24ff',
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

    loadAndDrawPolygons(map, mapgl);

    mapInstance.value = map;
    
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

.color-box.red { background-color: #d9534f; } 
.color-box.orange { background-color: #f0ad4e; } 
.color-box.green { background-color: #5cb85c; } 

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
</style>