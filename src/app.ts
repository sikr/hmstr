import { Config } from "./types";
import configJSON from "./conf/dev.conf.json";
import { Log as log } from "./log";
import { MqttClient } from "./mqtt";
import { GraphiteClient } from "./lib/graphite/graphite";
import { Entity } from "./entityWrapper";
import { EntityWrapper } from "./entityWrapper";
import { Guard } from "./guard";
import { CronJob } from "cron";
import { Rega } from "./rega";

const tid = "HMSTR";
const config: Config = configJSON;

let minuteReceived = 0;
let minuteSent = 0;

log.init(config.log);
log.info(`${tid} Starting...`);

//
// Guard handles signals, exceptions and service shutdown
//
const guard = Guard.getInstance(tid);

//
// Setup cron job(s)
//
const memoryUsageJob = new CronJob(
  "0 0 * * * *",
  () => {
    guard.memoryUsage();
  },
  null,
  true
);
const Stats60sJob = new CronJob(
  "0 * * * * *",
  () => {
    log.info(
      `${tid} received/sent ${minuteReceived}/${minuteSent} in the last 60 seconds`
    );
    minuteReceived = minuteSent = 0;
  },
  null,
  true
);

//
// Rega
//
const rega = Rega.getInstance();
rega.init(config);
rega.on("ready", () => {
  log.info(`${tid} Rega ready`);
});
rega.on("down", () => {
  log.warn(`${tid} Rega down`);
});
rega.on("unreachable", () => {
  log.warn(`${tid} Rega unreachable`);
});
const setupRega = async () => {
  let timeDiff = await rega.checkTime();
  log.info(`${tid} time difference to CCU: ${timeDiff} s`);
  rega.load().then((res) => {
    log.info(`foobar: ${res}`);
  });
};
setupRega();

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
  minuteReceived++;
  // log.debug(`${tid} Receive ${topic}, ${message}, ${packet}`);
  try {
    let e: Entity = entityWrapper.parse(topic, message);
    if (e && e.graphitePath) {
      await graphite.send({
        timestamp: e.timestamp,
        path: e.graphitePath,
        value: e.value,
      });
      minuteSent++;
      log.verbose(
        `${tid} Graphite > ${e.timestamp}, ${e.graphitePath}, ${e.value}`
      );
    }
    if (e && e.console) {
      log.info(`${e.device}/${e.channel}/${e.datapoint}: ${e.value}`);
    }
  } catch (error) {
    log.error(`$[tid} ${error}`);
  }
});
