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
import { Map } from "./types";
import { MeasurementCache } from "./measurementCache";
import { Offset } from "./offset";
import { Lowbat } from "./lowbat";

import mapJSON from "./data/map.json";

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
  map: Map;
  offset: Offset;

  constructor() {
    this.cache = [];
    this.map = mapJSON;
    this.offset = new Offset(this.map);
  }
  public parse(mqttTopic: string, mqttMessage: string): Entity {
    let entity: Entity;
    const topicRegEx =
      /(device|virtdev)\/status\/([a-zA-Z0-9]*)\/(\d*)\/([a-zA-Z0-9_]*)/;

    // dissect topic, example: 'device/status/ABC1234567/1/CHANNEL_NAME'
    let groups = mqttTopic.match(topicRegEx);
    if (groups && groups.length === 5) {
      // parse json message, example: '{"ts":1688224943273,"v":23.5,"s":0}'
      let messageJson = JSON.parse(mqttMessage);

      entity = {
        device: groups[2],
        channel: parseInt(groups[3], 10),
        datapoint: groups[4],
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
        this.map &&
        this.map[entity.device] &&
        this.map[entity.device][entity.channel] &&
        this.map[entity.device][entity.channel][entity.datapoint]
      ) {
        if (
          this.map[entity.device][entity.channel][entity.datapoint].graphite
        ) {
          entity.graphitePath =
            this.map[entity.device][entity.channel][entity.datapoint].graphite;
        }
        if (this.map[entity.device][entity.channel][entity.datapoint].console) {
          entity.console =
            this.map[entity.device][entity.channel][entity.datapoint].console;
        }
      }
      return entity;
    }
    return null;
  }
}
