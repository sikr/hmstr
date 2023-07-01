/*
 *  Global type definitions
 */

// External config definitions
import { GraphiteConfig } from "./lib/graphite/graphite";
import { MqttConfig } from "./mqtt";

// Config file data structure
export type Config = {
  graphite: GraphiteConfig;
  mqtt: MqttConfig;
};

// Persistence file data structure
export type Persistence = {
  [device: string]: {
    [channel: string]: {
      [datapoint: string]: {
        graphite: string;
        homematic: string;
        value?: number;
      };
    };
  };
};

// Since TypeScript is unaware of ISO-Date, this
// type is used to distinguish Date from ISO-Date
export type ISODate = string;
