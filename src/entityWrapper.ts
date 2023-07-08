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
import { Offset } from "./offset";
import { Map } from "./types";
import mapJSON from "./data/map.json";

export { EntityWrapper };

export type Entity = {
  device: string;
  channel: number;
  datapoint: string;
  timestamp: number;
  value: number;
  offset?: number;
  graphitePath?: string;
  console?: boolean;
} | null;

class EntityWrapper {
  map: Map;
  offsets: Offset;

  constructor() {
    this.map = mapJSON;
    this.offsets = new Offset(this.map);
  }
  public parse(mqttTopic: string, mqttMessage: string): Entity {
    let entity: Entity;
    const topicRegEx =
      /device\/status\/([a-zA-Z0-9]*)\/*(\d*)\/([a-zA-Z0-9_]*)/;

    // dissect topic, example: 'device/status/ABC1234567/1/CHANNEL_NAME'
    let groups = mqttTopic.match(topicRegEx);
    if (groups && groups.length === 4) {
      // parse json message, example: '{"ts":1688224943273,"v":23.5,"s":0}'
      let messageJson = JSON.parse(mqttMessage);

      entity = {
        device: groups[1],
        channel: parseInt(groups[2], 10),
        datapoint: groups[3],
        timestamp: messageJson.ts,
        value: messageJson.v,
      };
      // if an offset is defined, append it to
      // the entity and add it to its value
      if (this.offsets.exists(entity)) {
        entity.offset = this.offsets.getTotal(entity);
        entity.value = messageJson.v + entity.offset;
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
  isPersistable(e: Entity) {}
  public getChannelNumber(e: Entity): number {
    if (e && e.channel) {
      return e.channel;
    } else {
      return 0;
    }
  }
  public getDatapointName(e: Entity): string {
    if (e && e.datapoint) {
      return e.datapoint;
    } else {
      return "";
    }
  }
  public getValue(e: Entity): number {
    if (e && e.value) {
      return e.value;
    } else {
      return 0;
    }
  }
}
