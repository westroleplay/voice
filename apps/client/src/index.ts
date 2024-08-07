import { voiceTarget } from "@zerio-voice/utils/data";
import { getDistance, Wait } from "@zerio-voice/utils/functions";
import { getConfig } from "@zerio-voice/utils/config";
import { warn } from "@zerio-voice/utils/logger";
import { VoiceMode } from "@zerio-voice/utils/structs";
import { init as initProximity } from "./modules/proximity";
import { notify } from "./integrations/wrapper";
import Nui from "./modules/nui";

const serverId = GetPlayerServerId(PlayerId());
let voiceModes: Array<VoiceMode> = [];
let proximity = MumbleGetTalkerProximity();
let isTalking = false;

async function initialize() {
  const cfg = getConfig();

  if (cfg) {
    SetResourceKvp("zerio-voice_locale", cfg.locale.language);
    SetResourceKvpInt("zerio-voice_enabledUI", cfg.ui.enabled ? 1 : 0);
    SetResourceKvpInt(
      "zerio-voice_requireMousePressAswell",
      cfg.ui.interaction.requireMousePressAswell ? 1 : 0
    );
    voiceModes = cfg.voiceModes;

    SetResourceKvp("zerio-voice_interactionKey", cfg.ui.interaction.key);

    void new Nui();
    require("./modules/muting");
    require("./modules/volumes");
    initProximity(voiceModes);

    while (!MumbleIsConnected()) {
      warn("Awaiting mumble connection");
      await Wait(250);
    }

    setInterval(() => {
      if (cfg.ui.enabled) {
        updateNUIVoiceStatus();
      }

      checkForNearbyPlayers();
    }, 250);
  }
}

onNet("zerio-voice:client:notify", (text: string) => {
  notify(text);
});

onNet("mumbleConnected", async () => {
  const voiceMode = voiceModes[LocalPlayer.state.proximity];
  if (voiceMode) {
    MumbleSetTalkerProximity(voiceMode.range);
  }
  MumbleClearVoiceTarget(voiceTarget);
  MumbleSetVoiceTarget(voiceTarget);
  MumbleSetVoiceChannel(LocalPlayer.state.assignedChannel);

  while (
    MumbleGetVoiceChannelFromServerId(serverId) !==
    LocalPlayer.state.assignedChannel
  ) {
    await Wait(250);
    MumbleSetVoiceChannel(LocalPlayer.state.assignedChannel);
  }

  MumbleAddVoiceTargetChannel(voiceTarget, LocalPlayer.state.assignedChannel);
});

onNet("onPlayerDropped", (id: number) => {
  MumbleRemoveVoiceChannelListen(id);
});

onNet("onPlayerJoining", (id: number) => {
  MumbleAddVoiceChannelListen(id);
});

function updateNUIVoiceStatus() {
  const isCurrentlyTalking =
    (MumbleIsPlayerTalking(PlayerId()) as number | boolean) === 1;

  if (isCurrentlyTalking !== isTalking) {
    isTalking = isCurrentlyTalking;

    SendNUIMessage({
      action: "isTalkingNormally",

      data: isTalking
    });
  }
}

function proximityCheck(
  coords1: Array<number>,
  coords2: Array<number>
): boolean {
  const dist = getDistance(coords1, coords2);

  return dist !== -1 && dist < proximity;
}

function checkForNearbyPlayers() {
  const plr = PlayerPedId();

  if (plr) {
    const coords = GetEntityCoords(plr, true);
    proximity = MumbleGetTalkerProximity();

    MumbleClearVoiceTargetChannels(voiceTarget);
    MumbleAddVoiceChannelListen(LocalPlayer.state.assignedChannel);
    MumbleAddVoiceTargetChannel(voiceTarget, LocalPlayer.state.assignedChannel);

    const plrs = GetActivePlayers();

    for (let i = 0; i < plrs.length; i++) {
      const v = plrs[i];
      const serverId = GetPlayerServerId(v);
      const shouldAdd = proximityCheck(
        coords,
        GetEntityCoords(GetPlayerPed(v), true)
      );

      if (shouldAdd) {
        MumbleAddVoiceTargetChannel(
          voiceTarget,
          MumbleGetVoiceChannelFromServerId(serverId)
        );
      }
    }
  }
}

initialize();
