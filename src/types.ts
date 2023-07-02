/*
 *  Global type definitions
 */

// External config definitions
import { GraphiteConfig } from "./lib/graphite/graphite";
import { LogConfig } from "./log";
import { MqttConfig } from "./mqtt";

// Config file data structure
export type Config = {
  graphite: GraphiteConfig;
  log: LogConfig;
  mqtt: MqttConfig;
};

// Map file data structure
// The map file defines the conjunction between
// an MQTT topic and its related Graphite path
export type Map = {
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
