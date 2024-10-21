import { Socket, createConnection } from "net";
import { EventEmitter } from "events";
export { GraphiteClient };
export { GraphiteRecord };
export { GraphiteConfig };

interface GraphiteConfig {
  host: string;
  port: number;
  prefix: string;
}

interface GraphiteRecord {
  timestamp: number;
  path: string;
  value: number;
}

class GraphiteClient extends EventEmitter {
  connected: boolean;
  hangUp: boolean = false;
  host: string;
  port: number;
  prefix: string;
  reconnectTimeout: number = 10000;
  socket: Socket;

  constructor(config: GraphiteConfig) {
    super();

    this.connected = false;
    this.host = config.host || "127.0.0.1";
    this.port = config.port || 2003;
    this.prefix = config.prefix || "";
    this.socket = new Socket();

    this.socket.on("close", () => {
      this.OnClose();
    });

    this.socket.on("connect", () => {
      this.OnConnect();
    });

    this.socket.on("drain", () => {
      this.OnDrain();
    });

    this.socket.on("error", (error: Error) => {
      this.OnError(error);
    });
  }

  public connect(): boolean {
    this.socket.connect(this.port, this.host, () => {});
    return true;
  }

  public reconnect(): boolean {
    this.socket.connect(this.port, this.host, () => {});
    return true;
  }

  private OnClose(): void {
    this.connected = false;
    if (!this.hangUp) {
      setTimeout(() => {
        this.reconnect();
      }, this.reconnectTimeout);
    }
  }

  private OnConnect(): void {
    this.connected = true;
    this.emit("connect");
  }

  private OnDrain(): void {}

  private OnError(error: Error): void {
    this.emit("error", error);
  }

  public isConnected(): boolean {
    return false;
  }

  public async send(data: GraphiteRecord[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected === true) {
        var metric;
        var prefixFull = "";
        var timestamp;
        var metrics: string[] = [];

        if (this.prefix.length > 0) {
          prefixFull = this.prefix + ".";
        }
        data.forEach((d) => {
          timestamp = Math.round(d.timestamp / 1000).toString();
          metrics.push(`${prefixFull}${d.path} ${d.value} ${timestamp}\n`);
        });
        if (metrics.length > 0) {
          this.socket.write(metrics.join(""), () => {});
        }
        resolve();
      } else {
        reject("Sending data to Graphite failed.");
      }
    });
  }
}
