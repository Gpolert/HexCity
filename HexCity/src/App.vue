<script setup lang="ts"></script>

<template>
  <div id="map" style="width: 100%; height: 100vh"></div>
</template>

<script lang="ts" setup>
import { onMounted } from "vue";
import DG from "2gis-maps";

onMounted(() => {
  const map = DG.map("map", {
    center: [55.751244, 37.618423],
    zoom: 11,
    key: import.meta.env.VITE_2GIS_API_KEY,
  });
});
</script>
