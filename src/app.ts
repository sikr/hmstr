import mqtt from "mqtt";
import { Persistence } from "./types";
import persistence from "./data/persistence.json";
import config from "./conf/dev.conf.json";
import { GraphiteClient } from "./lib/graphite/graphite";
import { time } from "console";

const tid = "HMSTR";

//
// ensure graceful shutdown
//
process.on("SIGTERM", shutdown.bind(null, "SIGTERM"));
process.on("SIGINT", shutdown.bind(null, "SIGINT"));
process.on("uncaughtException", function (err) {
  try {
    var msg = JSON.stringify(err.stack);
    console.error(`${tid}: msg`);
    shutdown.bind(null, "uncaughtException");
  } catch (e) {
    process.exit(101);
  }
});

let p: Persistence = persistence;

let graphite: GraphiteClient = new GraphiteClient(
  config.graphite.host,
  config.graphite.port,
  config.graphite.prefix
);
graphite.connect();

let mqttOptions: mqtt.IClientOptions = {
  clean: true,
  // clientId:"mqttjs01",
  keepalive: 60,
  password: config.mqtt.password,
  port: 1883,
  properties: {
    requestResponseInformation: true,
    requestProblemInformation: true,
  },
  username: "hmqtt",
};
const mqttClient: mqtt.MqttClient = mqtt.connect(
  `mqtt://${config.mqtt.host}`,
  mqttOptions
);
mqttClient.on("connect", () => {
  console.info(`${tid}: connected to mqtt ${new Date()}`);
});
mqttClient.on("error", (err) => {
  console.error(`${tid}: MQTT Error - ${err}`);
});
mqttClient.subscribe("#", { qos: 1 });
mqttClient.on(
  "message",
  async function (topic: string, message: string, packet: string) {
    console.log(`${tid}: ${topic}, ${message}, ${packet}`);
    let messageJson;
    let timestamp;
    let value;

    let device: string;
    let channel: string;
    let datapoint: string;
    let path;
    let matches: string[] | null;
    const topicRegEx =
      /device\/status\/([a-zA-Z0-9]*)\/*(\d*)\/([a-zA-Z0-9_]*)/;
    matches = topic.match(topicRegEx);

    try {
      messageJson = JSON.parse(message);
      value = messageJson.v;
      timestamp = messageJson.ts;

      if (matches && matches.length === 4) {
        device = matches[1];
        channel = matches[2];
        datapoint = matches[3];

        if (p[device] && p[device][channel] && p[device][channel][datapoint]) {
          path = p[device][channel][datapoint]["graphite"];
          await graphite.send({
            timestamp: timestamp,
            path: path,
            value: value,
          });
          // console.info(`${tid}: ${path}, ${timestamp}, ${value}`);
        }
      }
    } catch (error) {
      // console.error(`$[tid}: ${error}`);
    }
  }
);

function shutdown(event: string) {
  console.info(`${tid}: ${event} - shutting down...`);
  process.exit(1);
}
