import { GoEMap } from "./types";
import GoEMapJSON from "./data/go-e.json";
import { Config } from "./types";
import { Datapoint } from "./types";
import { Entity } from "./entityWrapper";

import { GraphiteClient } from "./lib/graphite/graphite";
import { GraphiteRecord } from "./lib/graphite/graphite";
import { Log as log } from "./log";
import http from "http";

export class GoEClient {
  private config: Config | null = null;
  private graphiteClient: GraphiteClient;
  private initialized: boolean;
  private requestOptions;
  private pendingRequests;
  private map: GoEMap;
  private tid: string = "GOEC";

  constructor(config: Config, graphiteClient: GraphiteClient) {
    this.config = config;
    this.graphiteClient = graphiteClient;
    this.map = GoEMapJSON;
    this.initialized = true;
    this.pendingRequests = 0;
    if (!this.config?.goecharger?.host || !this.config?.goecharger?.port) {
      log.error(`${this.tid}: Incomplete configuration: goecharger`);
      this.initialized = false;
    }
    this.requestOptions = {
      hostname: this.config?.goecharger.host,
      port: this.config?.goecharger.port,
      path: "/api/status?filter=eto,wh,nrg,amp,tma",
      method: "GET",
    };
  }

  public poll() {
    log.info(`${this.tid}: poll`);
    if (!this.initialized) {
      log.error(`${this.tid}: Not initialized`);
      return;
    }
    this.pendingRequests += 1;
    let req = http.request(this.requestOptions, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk.toString();
      });
      res.on("end", () => {
        this.pendingRequests -= 1;
        let o = JSON.parse(data);
        let e = Object.entries(o);
        let ts = Date.now();
        let graphiteData: GraphiteRecord[] = [];
        e.forEach((d) => {
          let key = d[0];
          let value = d[1];
          let dp = <Datapoint>this.map[key];
          if (typeof value === "number") {
            if (dp.graphite) {
              graphiteData.push({
                timestamp: ts,
                path: dp.graphite,
                value: value,
              });
            }
          } else if (d[1] instanceof Object && d[1] instanceof Array) {
            for (let i in d[1]) {
              value = d[1][i];
              if (typeof value === "number") {
                graphiteData.push({
                  timestamp: ts,
                  path: (<Datapoint[]>this.map[key])[i].graphite,
                  value: value,
                });
                let foo = 1;
              }
            }
          }
        });
        if (graphiteData.length) {
          this.graphiteClient.send(graphiteData);
        }
      });
    });
    req.on("error", (err) => {
      this.pendingRequests -= 1;
      log.error(`${this.tid}: Request error`);
    });
    req.end();
  }
}
