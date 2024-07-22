<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useMainStore } from "../stores";
import { mdiMicrophone } from "@mdi/js";

import SvgIcon from "./SvgIcon.vue";

const mainStore = useMainStore();

const { talking } = storeToRefs(mainStore);
</script>

<template>
  <div class="absolute right-2 bottom-2 flex flex-col gap-2 items-end h-fit">
    <div class="flex flex-row gap-2 relative w-fit">
      <!-- Main Voice State -->
      <div
        class="w-8 h-8 bg-slate-900/90 rounded flex items-center justify-center shadow-xl"
      >
        <SvgIcon
          :path="mdiMicrophone"
          :height="24"
          :width="24"
          :class="{
            'fill-[#bbb]': !talking.normal,
            'fill-white': talking.normal
          }"
        />
      </div>
    </div>
  </div>
</template>
