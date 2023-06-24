import { Socket, createConnection } from "net";
import { EventEmitter } from "events";
export { GraphiteClient };
export { GraphiteRecord };

interface GraphiteRecord {
  timestamp: number;
  path: string;
  value: string;
}

class GraphiteClient extends EventEmitter {
  connected: boolean;
  hangUp: boolean = false;
  host: string;
  port: number;
  prefix: string;
  reconnectTimeout: number = 10;
  socket: Socket;

  constructor(host: string, port: number, prefix: string) {
    super();

    this.connected = false;
    this.host = host || "127.0.0.1";
    this.port = port || 2003;
    this.prefix = prefix || "";
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

    this.socket.on("error", () => {
      this.OnError();
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

  private OnError(): void {}

  public isConnected(): boolean {
    return false;
  }

  public async send(data: GraphiteRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connected === true) {
        var metric;
        var prefixFull = "";
        var timestamp;
        var preparedData = [];

        if (this.prefix.length > 0) {
          prefixFull = this.prefix + ".";
        }

        timestamp = Math.round(data.timestamp / 1000).toString();
        metric = `${prefixFull}${data.path} ${data.value} ${timestamp}\n`;
        this.socket.write(metric, () => {
          resolve();
        });
      } else {
        reject("Sending data to Graphite failed.");
      }
    });
  }
  // public async send(data: GraphiteRecord[]): Promise<void> {
  //   return new Promise((resolve, reject) => {
  //     if (this.connected === true) {
  //       var row;
  //       var prefixFull = "";
  //       var timestamp;
  //       var preparedData = [];

  //       if (this.prefix.length > 0) {
  //         prefixFull = this.prefix + ".";
  //       }

  //       for (var i = 0; i < data.length; i++) {
  //         timestamp = Math.round(data[i].timestamp / 1000).toString();
  //         row = `${prefixFull}${data[i].path} ${data[i].value} ${timestamp}\n`;
  //         // row =
  //         //   prefixFull +
  //         //   data[i].path +
  //         //   " " +
  //         //   data[i].value +
  //         //   " " +
  //         //   timestamp +
  //         //   "\n";
  //         preparedData.push(row);
  //       }
  //       this.socket.write(preparedData.join(""), () => {
  //         resolve();
  //       });
  //     } else {
  //       reject("Sending data to Graphite failed.");
  //     }
  //   });
  // }
}
