/*
 *  Entity processing
 *
 *  An entity covers the parsed MQTT data as well as the offset (if available)
 *  and the persistence definition.
 *
 *  Offsets are taken from and defined in ./data/offsets.json
 *  Persistence is taken from and defined in ./data/persistence.json
 *
 */
import { Offset } from "./offset";
import { Persistence } from "./types";
import persistenceJSON from "./data/persistence.json";

export { EntityWrapper };

export type Entity = {
  device: string;
  channel: number;
  datapoint: string;
  timestamp: number;
  value: number;
  offset?: number;
  graphitePath?: string;
} | null;

class EntityWrapper {
  p: Persistence;
  offsets: Offset;

  constructor() {
    this.p = persistenceJSON;
    this.offsets = new Offset(this.p);
  }
  public parse(mqttTopic: string, mqttMessage: string): Entity {
    let entity: Entity;
    const topicRegEx =
      /device\/status\/([a-zA-Z0-9]*)\/*(\d*)\/([a-zA-Z0-9_]*)/;

    // dissect topic
    let groups = mqttTopic.match(topicRegEx);
    if (groups && groups.length === 4) {
      // dissect message
      let messageJson = JSON.parse(mqttMessage);

      entity = {
        device: groups[1],
        channel: parseInt(groups[2], 10),
        datapoint: groups[3],
        timestamp: messageJson.ts,
        value: messageJson.v,
      };
      if (this.offsets.exists(entity)) {
        entity.offset = this.offsets.getTotal(entity);
        entity.value = messageJson.v + entity.offset;
      }
      if (
        this.p &&
        this.p[entity.device] &&
        this.p[entity.device][entity.channel] &&
        this.p[entity.device][entity.channel][entity.datapoint] &&
        this.p[entity.device][entity.channel][entity.datapoint].graphite
      ) {
        entity.graphitePath =
          this.p[entity.device][entity.channel][entity.datapoint].graphite;
      }
      return entity;
    }
    return null;
  }
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
