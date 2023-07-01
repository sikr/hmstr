/// <reference types="node" />
/// <reference types="node" />
import { Socket } from "net";
import { EventEmitter } from "events";
export { GraphiteClient };
export { GraphiteRecord };
interface GraphiteRecord {
  timestamp: number;
  path: string;
  value: number;
}
declare class GraphiteClient extends EventEmitter {
  connected: boolean;
  hangUp: boolean;
  host: string;
  port: number;
  prefix: string;
  reconnectTimeout: number;
  socket: Socket;
  constructor(host: string, port: number, prefix: string);
  connect(): boolean;
  reconnect(): boolean;
  private OnClose;
  private OnConnect;
  private OnDrain;
  private OnError;
  isConnected(): boolean;
  send(data: GraphiteRecord): Promise<void>;
}
