import { Config } from "./types";
import configJSON from "./conf/dev.conf.json";
import { MqttClient } from "./mqtt";
import { GraphiteClient } from "./lib/graphite/graphite";
import { Entity } from "./entityWrapper";
import { EntityWrapper } from "./entityWrapper";
import { Guard } from "./guard";

const tid = "HMSTR";
const config: Config = configJSON;

//
// Guard handles signals, exceptions and service shutdown
//
const guard = new Guard(tid);

//
// Entity wrapper/processor
//
const entityWrapper = new EntityWrapper();

//
// Graphite client to export to
//
const graphite: GraphiteClient = new GraphiteClient(config.graphite);
graphite.connect();

//
// MQTT client from which the data is received
//
const mqtt: MqttClient = new MqttClient(config.mqtt);
mqtt.connect();

// Export MQTT data to Graphite
mqtt.on("message", async (topic: string, message: string, packet: object) => {
  // console.log(`${tid}: ${topic}, ${message}, ${packet}`);
  try {
    let e: Entity = entityWrapper.parse(topic, message);
    if (e && e.graphitePath) {
      await graphite.send({
        timestamp: e.timestamp,
        path: e.graphitePath,
        value: e.value,
      });
      console.log(
        // `${tid}: device=${e.device}, channel=${e.channel}, datapoint=${e.datapoint}, timestamp=${e.timestamp}, value=${e.value}`
        `${tid}: ${e.timestamp}, ${e.graphitePath}, ${e.value}`
      );
    }
    // console.info(`${tid}: ${path}, ${timestamp}, ${value}`);
  } catch (error) {
    // console.error(`$[tid}: ${error}`);
  }
});
