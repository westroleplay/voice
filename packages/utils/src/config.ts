import { type Config } from "./structs";

export function getConfig(): Config | null {
  try {
    return JSON.parse(
      LoadResourceFile(GetCurrentResourceName(), "config.json"),
    );
  } catch (e) {
    console.warn(e);
    return null;
  }
}
