import { Schema, Validator } from "jsonschema";
import { Config } from "./structs";

const validator = new Validator();

const configLoggingSchema: Schema = {
  id: "/ConfigLogging",
  type: "object",
  properties: {
    level: {
      type: "string",
      required: true
    }
  },
  required: true
};
validator.addSchema(configLoggingSchema, "/ConfigLogging");

const configUIInteractionSchema: Schema = {
  id: "/ConfigUIInteraction",
  type: "object",
  properties: {
    key: {
      type: "string",
      required: true
    },
    requireMousePressAswell: {
      type: "boolean",
      required: true
    }
  },
  required: true
};
validator.addSchema(configUIInteractionSchema, "/ConfigUIInteraction");

const configFrameworkSchema: Schema = {
  id: "/ConfigFramework",
  type: "object",
  properties: {
    customResourceName: {
      type: ["string", "null"],
      required: false
    }
  },
  required: true
};
validator.addSchema(configFrameworkSchema, "/ConfigFramework");

const configUISchema: Schema = {
  id: "/ConfigUI",
  type: "object",
  properties: {
    enabled: {
      type: "boolean",
      required: true
    },
    interaction: {
      $ref: "/ConfigUIInteraction",
      required: true
    }
  },
  required: true
};
validator.addSchema(configUISchema, "/ConfigUI");

const configLocaleSchema: Schema = {
  id: "/ConfigLocale",
  type: "object",
  properties: {
    language: {
      type: "string",
      required: true
    }
  },
  required: true
};
validator.addSchema(configLocaleSchema, "/ConfigLocale");

const configVoiceMode: Schema = {
  id: "/ConfigVoiceMode",
  type: "object",
  properties: {
    range: {
      type: "number",
      required: true
    },
    name: {
      type: "string",
      required: true
    },
    default: {
      type: ["boolean", "null"],
      required: false
    }
  },
  required: true
};
validator.addSchema(configVoiceMode, "/ConfigVoiceMode");

const configProximity: Schema = {
  id: "/ConfigProximity",
  type: "object",
  properties: {
    keybind: {
      type: "string",
      required: true
    }
  },
  required: true
};
validator.addSchema(configProximity, "/ConfigProximity");

const configSchema: Schema = {
  type: "object",
  properties: {
    logging: {
      $ref: "/ConfigLogging",
      required: true
    },
    ui: {
      $ref: "/ConfigUI",
      required: true
    },
    locale: {
      $ref: "/ConfigLocale",
      required: true
    },
    framework: {
      $ref: "/ConfigFramework",
      required: true
    },
    proximity: {
      $ref: "/ConfigProximity",
      required: true
    },
    voiceModes: {
      type: "array",
      required: true,
      items: {
        $ref: "/ConfigVoiceMode",
        required: true
      }
    }
  }
};
validator.addSchema(configLoggingSchema, "/ConfigSchema");

export function validateConfig(cfg: unknown): boolean {
  const isValid = validator.validate(cfg, configSchema).valid;

  if (isValid) {
    let defaultCount = 0;
    const validCfg = cfg as Config;

    for (let i = 0; i < validCfg.voiceModes.length; i++) {
      const v = validCfg.voiceModes[i];

      if (v && v.default) {
        defaultCount++;
      }
    }

    return defaultCount == 1;
  } else {
    return false;
  }
}
