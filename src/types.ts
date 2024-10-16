/*
 *  Global type definitions
 */

// External config definitions
import { GraphiteConfig } from "./lib/graphite/graphite";
import { LogConfig } from "./log";
import { MqttConfig } from "./mqtt";

export interface CcuConfig {
  host: string;
}

export interface SslConfig {
  ca: string;
  cert: string;
  key: string;
}

// Config file data structure
export type Config = {
  ccu: CcuConfig;
  graphite: GraphiteConfig;
  log: LogConfig;
  mqtt: MqttConfig;
  ssl: SslConfig;
};

// Homematic map file data structure
// The map file defines the conjunction between a Homematic MQTT topic and its
// related Graphite path.
export type HomematicMap = {
  [device: string]: {
    [channel: string]: {
      [datapoint: string]: {
        graphite: string;
        homematic: string;
        console?: boolean;
        value?: number;
      };
    };
  };
};

// Shelly map file data structure
// The map file defines the conjunction between a Shelly MQTT topic and its
// related Graphite path.
export type ShellyMap = {
  [device: string]: {
  //   [channel: string]: {
  //     [datapoint: string]: {
         graphite: string;
  //       homematic: string;
  //       console?: boolean;
  //       value?: number;
  //     };
  //   };
  };
};

// Homematic devices json/file data structure
//
//
export type HomematicDevices = {
  [id: string]: {
    Name: string;
    TypeName: string;
    HssType: string;
    Address: string;
    Interface: string;
    Channels: number[];
  };
};

// Homematic channels json/file data structure
//
//
export type HomematicChannels = {
  [id: string]: {
    Name: string;
    TypeName: string;
    HssType: string;
    Direction: number;
    Type: number;
    Address: string;
    Label: string;
    Parent: number;
    Datapoints: {
      [Name: string]: number;
    };
  };
};

// Homematic datapoints json/file data structure
//
//
export type HomematicDatapoints = {
  [id: string]: {
    Name: string;
    TypeName: string;
    Operations: string | number;
    ValueType: number;
    ValueList?: string;
    ValueUnit?: string;
    Timestamp: string;
    Value: string | number | boolean | null;
    Parent: number;
  };
};

// Homematic roms json/file data structure
//
//
export type HomematicRooms = {
  [id: string]: {
    Name: string;
    TypeName: string;
    EnumInfo: string;
    Channels: number[];
  };
};

// Since TypeScript is unaware of ISO-Date, this
// type is used to distinguish Date from ISO-Date
export type ISODate = string;
