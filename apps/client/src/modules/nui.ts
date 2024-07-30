import { NuiCallback } from "@zerio-voice/utils/structs";

class Nui {
  constructor() {
    RegisterNuiCallback("load", (_data: unknown, cb: NuiCallback) => {
      SendNUIMessage({
        action: "updateDebugState",
        data: GetConvarInt("zerio_voice_debug", 0)
      });

      cb("ok");
    });
  }
}

export default Nui;
