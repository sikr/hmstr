/*
 *  Entity processing
 *
 *  An entity covers the parsed MQTT data as well as the offset (if available)
 *  and the mapping between MQTT, Homematic and Graphite.
 *
 *  The offsets are taken from and defined in ./data/offsets.json
 *  The mapping is taken from and defined in ./data/map.json
 *
 */
import { HomematicMap } from "./types";
import { ShellyMap } from "./types";
import { MeasurementCache } from "./measurementCache";
import { Offset } from "./offset";
import { Lowbat } from "./lowbat";

import homematicMapJSON from "./data/homematic.json";
import shellyMapJSON from "./data/shelly.json";

export type Entity = {
  device: string;
  channel: number;
  datapoint: string;
  timestamp: number;
  value: number | boolean;
  offset?: number;
  graphitePath?: string;
  console?: boolean;
} | null;

export class EntityWrapper {
  cache: MeasurementCache[];
  homematicMap: HomematicMap;
  shellyMap: ShellyMap;
  offset: Offset;

  constructor() {
    this.cache = [];
    this.homematicMap = homematicMapJSON;
    this.shellyMap = shellyMapJSON;
    this.offset = new Offset(this.homematicMap);
  }
  public parse(mqttTopic: string, mqttMessage: String|Buffer): Entity {
    let entity: Entity;
    const homematicTopicRegEx =
      /(device|virtdev)\/status\/([a-zA-Z0-9]*)\/(\d*)\/([a-zA-Z0-9_]*)/;
    // const shellyTopicRegEx1 =
    //   /(shellies)\/([a-zA-Z0-9-]*)\/([a-zA-Z0-9-]*)/;
    // const shellyTopicRegEx2 =
    //   /(shellies)\/([a-zA-Z0-9-]*)\/([a-zA-Z0-9-]*)\/(\d*)/;
    // const shellyTopicRegEx3 =
    //   /(shellies)\/([a-zA-Z0-9-]*)\/([a-zA-Z0-9-]*)\/(\d*)\/([a-zA-Z0-9-]*)/;
    // let shelly = mqttTopic.match(shellyTopicRegEx1);
    // if (shelly && shelly.length > 2) {
    // }
    if (mqttTopic.indexOf("shellies/") == 0) {
      let mqttPath = mqttTopic.substring(9);
      if (this.shellyMap[mqttPath] && this.shellyMap[mqttPath].graphite) {
        let value;
        if (mqttMessage.toString() == 'on') {
          value = 1;
        }
        else if (mqttMessage.toString() == 'off') {
          value = 0;
        }
        else {
          value = parseInt(mqttMessage.toString(), 10);
        }
        entity = {
          device: mqttPath.substring(0, mqttPath.indexOf("/")),
          channel: 0,
          datapoint: mqttPath.substring(mqttPath.indexOf("/") + 1),
          timestamp: Date.now(),
          value: value,
        };
        entity.graphitePath = this.shellyMap[mqttPath].graphite;
        return entity;
      }
    }
    // dissect topic, example: 'device/status/ABC1234567/1/CHANNEL_NAME'
    let homematic = mqttTopic.match(homematicTopicRegEx);
    if (homematic && homematic.length === 5) {
      // parse json message, example: '{"ts":1688224943273,"v":23.5,"s":0}'
      let messageJson = JSON.parse(mqttMessage.toString());
      entity = {
        device: homematic[2],
        channel: parseInt(homematic[3], 10),
        datapoint: homematic[4],
        timestamp: messageJson.ts,
        value: messageJson.v,
      };
      if (entity.datapoint === "LOWBAT") {
        Lowbat.handle(entity);
      } else {
        this.offset.process(entity);
      }
      // add graphite path if available
      if (
        this.homematicMap &&
        this.homematicMap[entity.device] &&
        this.homematicMap[entity.device][entity.channel] &&
        this.homematicMap[entity.device][entity.channel][entity.datapoint]
      ) {
        if (
          this.homematicMap[entity.device][entity.channel][entity.datapoint].graphite
        ) {
          entity.graphitePath =
            this.homematicMap[entity.device][entity.channel][entity.datapoint].graphite;
        }
        if (this.homematicMap[entity.device][entity.channel][entity.datapoint].console) {
          entity.console =
            this.homematicMap[entity.device][entity.channel][entity.datapoint].console;
        }
      }
      return entity;
    }
    return null;
  }
}
