import { RadioMember } from "@zerio-voice/utils/structs";
import { info } from "@zerio-voice/utils/logger";
import { getTranslation } from "@zerio-voice/utils/translations";
import { voiceTarget } from "@zerio-voice/utils/data";
import { RadioSubmix } from "./submix";

const gameName = GetGameName();
const radioEnabled = GetResourceKvpInt("zerio-voice_enableRadio") === 1;
const enableRadioSubmix =
  GetResourceKvpInt("zerio-voice_enableRadioSubmix") === 1;
const enableMicClicks =
  GetResourceKvpInt("zerio-voice_enableRadioMicClicks") === 1;
const micClicksVolume = GetResourceKvpFloat("zerio-voice_micClicksVolume");
const keybind = GetResourceKvpString("zerio-voice_radioKeybind");
const radioData: Record<number, Array<RadioMember>> = {};
const playerServerId = GetPlayerServerId(PlayerId());
let radioTalkingTick: number | null = null;

function playMicClicks(isTalking: boolean) {
  if (enableMicClicks) {
    SendNUIMessage({
      action: "playRadioMicClicks",
      data: {
        toggled: isTalking,
        volume: micClicksVolume
      }
    });
  }
}

function handleVoiceTargets() {
  const radioFreq = LocalPlayer.state.currentRadioFreq;

  if (!radioFreq) {
    return;
  }

  const channelData = radioData[radioFreq];

  if (channelData) {
    for (let i = 0; i < channelData.length; i++) {
      const v = channelData[i];

      if (v && playerServerId !== v.source) {
        MumbleAddVoiceTargetPlayerByServerId(voiceTarget, v.source);
      }
    }
  }
}

function radioToggle(toggle: boolean): void {
  const currentRadioFreq = LocalPlayer.state.currentRadioFreq;

  if (!radioEnabled || !currentRadioFreq) {
    return;
  }

  if (toggle) {
    handleVoiceTargets();

    emitNet("zerio-voice:server:setTalkingOnRadio", true);

    radioTalkingTick = setTick(() => {
      SetControlNormal(0, 249, 1.0);
      SetControlNormal(1, 249, 1.0);
      SetControlNormal(2, 249, 1.0);
    });
  } else {
    LocalPlayer.state.set("talkingOnRadio", false, true);
    emitNet("zerio-voice:server:setTalkingOnRadio", false);

    MumbleClearVoiceTargetPlayers(voiceTarget);

    if (radioTalkingTick) {
      clearTick(radioTalkingTick);
      radioTalkingTick = null;
    }
  }
}

function addRadioChannel(frequency: number) {
  if (!radioEnabled) {
    return false;
  }

  emitNet("zerio-voice:server:addPlayerToRadioChannel", frequency);

  return true;
}

global.exports("addRadioChannel", addRadioChannel);

function removeRadioChannel(frequency: number) {
  if (!radioEnabled) {
    return false;
  }

  emitNet("zerio-voice:server:removePlayerFromRadioChannel", frequency);

  return true;
}
global.exports("removeRadioChannel", removeRadioChannel);

export function changeCurrentRadioFreq(frequency?: number | null) {
  if (frequency && radioData[frequency]) {
    LocalPlayer.state.set("currentRadioFreq", frequency, true);

    return true;
  }

  return false;
}
global.exports("changeCurrentRadioFreq", changeCurrentRadioFreq);

if (gameName == "fivem") {
  RegisterCommand(
    "+radio",
    () => {
      radioToggle(true);
    },
    false
  );
  emit("chat:removeSuggestion", "/+radio");

  RegisterCommand(
    "-radio",
    () => {
      radioToggle(false);
    },
    false
  );
  emit("chat:removeSuggestion", "/-radio");

  RegisterKeyMapping(
    "+radio",
    getTranslation(["radio", "keybind"]),
    "keyboard",
    keybind
  );
} else if (gameName == "redm") {
  // todo: fix key handling for redm
}

onNet(
  "zerio-voice:client:setTalkingOnRadio",
  (freq: number, src: number, isTalking: boolean) => {
    if (src == playerServerId) {
      // this is the local player, should only play mic clicks
      playMicClicks(isTalking);
      SendNUIMessage({
        action: "isTalkingOnRadio",
        data: isTalking
      });
      SendNUIMessage({
        action: "setTalkingOnRadio",
        data: {
          source: playerServerId,
          frequency: freq,
          isTalking: isTalking
        }
      });

      LocalPlayer.state.set("talkingOnRadio", true, true);
    } else {
      // not the local player
      const newData = radioData[freq];

      if (newData) {
        const newPlrIdx = newData.findIndex((p) => p.source === src);

        if (newPlrIdx !== -1) {
          const newPlrData = newData[newPlrIdx];

          if (newPlrData) {
            newPlrData.talking = isTalking;

            if (isTalking) {
              MumbleSetVolumeOverrideByServerId(src, 0.6);
            } else {
              MumbleSetVolumeOverrideByServerId(src, -1);
            }

            playMicClicks(isTalking);

            if (enableRadioSubmix) {
              if (isTalking) {
                RadioSubmix.enable();
              } else {
                RadioSubmix.disable();
              }
            }

            newData[newPlrIdx] = newPlrData;
            radioData[freq] = newData;

            SendNUIMessage({
              action: "setTalkingOnRadio",
              data: {
                source: src,
                frequency: freq,
                isTalking: isTalking
              }
            });
          }
        }
      }
    }
  }
);

// player joined a new channel
onNet(
  "zerio-voice:client:syncRawPlayers",
  (freq: number, players: Array<RadioMember>) => {
    radioData[freq] = players;

    SendNUIMessage({
      action: "syncRawRadioPlayers",
      data: {
        frequency: freq,
        players: players
      }
    });

    if (LocalPlayer.state.currentRadioFreq == null) {
      LocalPlayer.state.set("currentRadioFreq", freq, true);
    }
  }
);

onNet(
  "zerio-voice:client:playerAddedToRadioChannel",
  (freq: number, src: number, name: string) => {
    const newList = radioData[freq];

    if (newList) {
      newList.push({
        talking: false,
        name: name,
        source: src
      });

      radioData[freq] = newList;

      SendNUIMessage({
        action: "playerAddedToRadioChannel",
        data: {
          frequency: freq,
          plr: {
            name: name,
            source: src,
            talking: false
          }
        }
      });
    }
  }
);

onNet(
  "zerio-voice:client:playerRemovedFromRadioChannel",
  (freq: number, src: number) => {
    if (src === playerServerId) {
      delete radioData[freq];

      const keys = Object.keys(radioData);

      if (keys.length === 0) {
        LocalPlayer.state.set("currentRadioFreq", null, true);
      } else {
        if (LocalPlayer.state.currentRadioFreq == freq) {
          LocalPlayer.state.set("currentRadioFreq", Number(keys[0]), true);
        }
      }

      SendNUIMessage({
        action: "removedFromRadioChannel",
        data: freq
      });
    } else {
      let newList = radioData[freq];

      if (newList) {
        newList = newList.filter((p) => p.source !== src);

        radioData[freq] = newList;

        SendNUIMessage({
          action: "removePlayerFromRadioChannel",
          data: {
            frequency: freq,
            source: src
          }
        });
      }
    }
  }
);

AddStateBagChangeHandler(
  "currentRadioFreq",
  "",
  (_name: string, _key: string, val: number | null) => {
    SendNUIMessage({
      action: "setCurrentRadioChannel",
      data: val
    });
  }
);

const debug = GetConvarInt("zerio_voice_debug", 0);

if (debug >= 1) {
  if (debug >= 2) {
    setInterval(() => {
      info("----------");
      info("localstate radioChannels", LocalPlayer.state.radioChannels);
      info("radioData", radioData);
      info("currentRadioFreq", LocalPlayer.state.currentRadioFreq);
    }, 2500);
  }

  RegisterCommand(
    "addRadioChannel",
    (_src: number, args: Array<string>) => {
      addRadioChannel(Number(args[0]));
    },
    false
  );
  emit(
    "chat:addSuggestion",
    "/addRadioChannel",
    "DEV COMMAND: Add an radio channel to the local player",
    [
      {
        name: "frequency",
        help: "The radio frequency"
      }
    ]
  );

  RegisterCommand(
    "changeRadioChannel",
    (_src: number, args: Array<string>) => {
      changeCurrentRadioFreq(Number(args[0]));
    },
    false
  );
  emit(
    "chat:addSuggestion",
    "/changeRadioChannel",
    "DEV COMMAND: Change the current radio channel of the local player",
    [
      {
        name: "frequency",
        help: "The radio frequency"
      }
    ]
  );

  RegisterCommand(
    "removeRadioChannel",
    (_src: number, args: Array<string>) => {
      removeRadioChannel(Number(args[0]));
    },
    false
  );
  emit(
    "chat:addSuggestion",
    "/removeRadioChannel",
    "DEV COMMAND: Remove an radio channel from the local player",
    [
      {
        name: "frequency",
        help: "The radio frequency"
      }
    ]
  );
}

const initialRadioFreq = LocalPlayer.state.currentRadioFreq;

if (initialRadioFreq) {
  addRadioChannel(initialRadioFreq);
}
