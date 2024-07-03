<template>
  <header>
    <div
      class="container flex flex-col md:flex-row gap-5 items-center justify-between"
    >
      <IconAtabix class="text-white h-10" :fontControlled="false" />

      <NuxtImg src="/febo.png" width="143" height="40" class="select-none" />
    </div>
  </header>
</template>

<script setup>
const { locale, setLocale } = useI18n();
import IconAtabix from "~/assets/icons/atabix.svg";

const currentDate = new Date().toLocaleDateString("nl-NL", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
</script>

<style scoped>
header {
  @apply py-5 bg-green-1 text-white;
}
</style>
