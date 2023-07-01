/*
 *  MQTT client wrapper
 */
import mqtt from "mqtt";
import { EventEmitter } from "stream";

export { MqttConfig };
export { MqttClient };

interface MqttConfig {
  host: string;
  password: string;
}

class MqttClient extends EventEmitter {
  tid = "MQTT";
  config: MqttConfig;
  client: mqtt.MqttClient | null = null;
  options: mqtt.IClientOptions;

  constructor(config: MqttConfig) {
    super();
    this.config = config;
    this.options = {
      clean: true,
      // clientId:"mqttjs01",
      keepalive: 60,
      password: config.password,
      port: 1883,
      properties: {
        requestResponseInformation: true,
        requestProblemInformation: true,
      },
      username: "hmqtt",
    };
  }
  public connect() {
    this.client = mqtt.connect(`mqtt://${this.config.host}`, this.options);
    this.client.on("connect", () => {
      console.info(`${this.tid}: connected to mqtt ${new Date()}`);
    });
    this.client.on("error", (err) => {
      console.error(`${this.tid}: MQTT Error - ${err}`);
    });
    this.client.subscribe("#", { qos: 1 });
    this.client.on("message", (topic, message, packet) => {
      this.emit("message", topic, message, packet);
    });
  }
}
