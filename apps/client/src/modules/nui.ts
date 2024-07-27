import { NuiCallback } from "@zerio-voice/utils/structs";

const offsetX = 100;
const offsetY = 50;

class Nui {
  hasFocus = false;

  constructor() {
    RegisterNuiCallback("removeFocus", (_data: unknown, cb: NuiCallback) => {
      this.toggleFocus(false);

      SendNUIMessage({
        action: "closed"
      });

      cb("ok");
    });

    RegisterNuiCallback("load", (_data: unknown, cb: NuiCallback) => {
      SendNUIMessage({
        action: "updateDebugState",
        data: GetConvarInt("zerio_voice_debug", 0)
      });

      cb("ok");
    });
  }

  getInitialCoords(): [number, number] {
    const [resX, resY] = GetActiveScreenResolution();

    return [(resX - offsetX) / resX, (resY - offsetY) / resY];
  }

  toggleFocus(toggled: boolean) {
    if (this.hasFocus !== toggled) {
      this.hasFocus = toggled;

      if (toggled) {
        const initialCoords = this.getInitialCoords();

        SetCursorLocation(initialCoords[0], initialCoords[1]);
      }

      SetNuiFocus(toggled, toggled);
    }
  }
}

export default Nui;
