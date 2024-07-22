<script setup lang="ts">
import { useMainStore } from "./stores";
import { postRequest } from "./utils";
import { onMounted, ref, Ref } from "vue";
import { storeToRefs } from "pinia";

import VoiceState from "./components/VoiceState.vue";

const mainStore = useMainStore();
const { enabled } = storeToRefs(mainStore);

const micClickOn: Ref<null | HTMLAudioElement> = ref(null);
const micClickOff: Ref<null | HTMLAudioElement> = ref(null);

onMounted(() => {
  window.addEventListener("message", (e: MessageEvent) => {
    switch (e.data.action) {
      case "isTalkingNormally":
        mainStore.talking.normal = e.data.data;
        break;
      case "updateDebugState":
        mainStore.debug = e.data.data;
        break;
    }
  });

  window.addEventListener("keydown", (e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case "escape":
        mainStore.close();
        break;
    }
  });

  /*  load initial cfg/state
   *  this is used as the client & ui might load/initialize in different orders
   *  meaning that we cant just assume that the ui is loaded when the client sends an nui event with all the initial state
   */
  let loaded = false;
  function tryToLoad() {
    postRequest("load")
      .then(() => {
        loaded = true;
      })
      .catch(() => {
        setTimeout(() => {
          if (!loaded) {
            tryToLoad();
          }
        }, 1000);
      });
  }

  tryToLoad();
});
</script>

<template>
  <audio ref="micClickOn" src="mic_click_on.ogg" />
  <audio ref="micClickOff" src="mic_click_off.ogg" />

  <template v-if="enabled">
    <VoiceState />
  </template>
</template>
