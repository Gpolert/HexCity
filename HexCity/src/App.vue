<template>
  <div id="map" style="width: 100%; height: 100vh"></div>
  
  <div class="custom-zoom-controls">
    <button @click="zoomIn" class="map-zoom-btn zoom-btn-primary">+</button>
    <button @click="zoomOut" class="map-zoom-btn zoom-btn-primary">-</button> 
  </div>

  <div class="legend-container">
    <button @click="toggleLegend" class="legend-toggle-btn">?</button>
    
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
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
// @ts-ignore
import DG from "2gis-maps"; 

const mapInstance = ref<any | null>(null);
const showLegend = ref(false); 

const zoomIn = () => {
  if (mapInstance.value) {
    mapInstance.value.zoomIn();
  }
};

const zoomOut = () => {
  if (mapInstance.value) {
    mapInstance.value.zoomOut();
  }
};

const toggleLegend = () => {
  showLegend.value = !showLegend.value;
};

onMounted(() => {
  const map = DG.map("map", {
    center: [55.751244, 37.618423],
    zoom: 11,
    key: import.meta.env.VITE_2GIS_API_KEY,
    
    zoomControl: false, 
    scaleControl: 'bottomRight', 
    fullscreenControl: false, 
  });
  
  mapInstance.value = map;
});
</script>

<style>
/* ❗ НОВЫЙ ШРИФТ ДЛЯ ВСЕГО ТЕЛА */
body {
  font-family: 'Roboto', sans-serif;
}

/* --- СТИЛИ ДЛЯ ЛЕГЕНДЫ И КНОПКИ '?' --- */

.legend-container {
  position: absolute;
  top: 10px; 
  left: 10px; 
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start; 
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
  /* Начальное состояние: скрыт */
  width: 250px;
  padding: 0 15px; /* Убираем вертикальный padding, чтобы не мешать max-height */
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  line-height: 1.5;
  overflow: hidden; /* Скрываем контент при max-height: 0 */
  
  /* ⭐ КЛЮЧЕВОЙ МОМЕНТ АНИМАЦИИ: ИСХОДНОЕ СОСТОЯНИЕ */
  max-height: 0; 
  opacity: 0;
  transition: max-height 0.4s ease-in-out, opacity 0.4s ease-in-out, padding 0.4s;
}

.legend-widget.open {
  /* ⭐ КОНЕЧНОЕ СОСТОЯНИЕ: Открыт */
  max-height: 300px; /* Должно быть больше, чем фактическая высота виджета */
  opacity: 1;
  padding: 15px; /* Возвращаем нужный padding */
}

/* Изменения в контенте виджета для соответствия анимации */
.legend-widget.open h4,
.legend-widget.open .legend-item,
.legend-widget.open p {
  /* Гарантируем, что контент внутри открытого виджета виден */
  opacity: 1;
  transition: opacity 0.4s 0.2s; /* Небольшая задержка, чтобы контент появился после открытия */
}
.legend-widget h4,
.legend-widget .legend-item,
.legend-widget p {
  opacity: 0;
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

/* --- СТИЛИ ДЛЯ КНОПОК МАСШТАБИРОВАНИЯ (БЕЗ ИЗМЕНЕНИЙ) --- */

.custom-zoom-controls {
  position: absolute;
  bottom: 20px; 
  left: 20px;  
  z-index: 1000; 
  display: flex;
  flex-direction: column;
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
</style>