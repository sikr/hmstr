import { Config } from "./types";
import configJSON from "./conf/dev.conf.json";
import { Log as log } from "./log";
import { MqttClient } from "./mqtt";
import { GraphiteClient } from "./lib/graphite/graphite";
import { Entity } from "./entityWrapper";
import { EntityWrapper } from "./entityWrapper";
import { Guard } from "./guard";
import { CronJob } from "cron";

const tid = "HMSTR";
const config: Config = configJSON;

log.init(config.log);
log.info(`${tid} Starting...`);

//
// Guard handles signals, exceptions and service shutdown
//
const guard = Guard.getInstance(tid);

//
// Setup cron job(s)
//
const ob = new CronJob(
  "0 0 * * * *",
  () => {
    guard.memoryUsage();
  },
  null,
  true
);

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
  // log.debug(`${tid} Receive ${topic}, ${message}, ${packet}`);
  try {
    let e: Entity = entityWrapper.parse(topic, message);
    if (e && e.graphitePath) {
      await graphite.send({
        timestamp: e.timestamp,
        path: e.graphitePath,
        value: e.value,
      });
      log.verbose(
        `${tid} Graphite > ${e.timestamp}, ${e.graphitePath}, ${e.value}`
      );
    }
  } catch (error) {
    log.error(`$[tid} ${error}`);
  }
});
