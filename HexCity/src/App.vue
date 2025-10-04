<template>
  <div id="map" style="width: 100%; height: 100vh"></div>
  
  <div class="custom-zoom-controls">
    <button @click="zoomIn" class="map-zoom-btn zoom-btn-primary">+</button>
    <button @click="zoomOut" class="map-zoom-btn zoom-btn-primary">-</button> 
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
// @ts-ignore
import DG from "2gis-maps"; 

const mapInstance = ref<any | null>(null);

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

onMounted(() => {
  const map = DG.map("map", {
    center: [55.751244, 37.618423],
    zoom: 11,
    key: import.meta.env.VITE_2GIS_API_KEY,
    
    zoomControl: false, 
    scaleControl: 'topRight', 
    
    fullscreenControl: false, 
  });
  
  mapInstance.value = map;
});
</script>

<style>
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