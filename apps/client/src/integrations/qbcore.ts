import { Client } from "@zerio2/qbcore.js";

const frameworkName =
  GetResourceKvpString("zerio-voice_customFrameworkName") ?? "qb-core";
export let QBCore: Client | null = null;

try {
  const exps = global.exports[frameworkName];
  if (exps && exps.getCoreObject) {
    QBCore = exps.getCoreObject();
  }
} catch (_e) {
  // could not load qbcore, probably doesnt exist on the server
}
