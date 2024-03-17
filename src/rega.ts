/*
 * rega.js
 *
 * Runs scripts on Homematic CCU
 *
 * Parts of this script and the regascripts are taken from hobbyquaker's
 * ccu.io project: https://github.com/hobbyquaker/ccu.io
 *
 * CC BY-NC 3.0
 *
 * Commercial use disallowed
 *
 *
 */

// import fs from "fs";
import fs from "node:fs/promises";
import path from "path";
import http from "http";
import https from "https";
import xml2js from "xml2js";

import { Log as log } from "./log";
import { Config } from "./types";
import { EventEmitter } from "stream";
import { HomematicDevices } from "./types";
import { HomematicChannels } from "./types";
import { HomematicDatapoints } from "./types";
import { HomematicRooms } from "./types";

export { Rega };

type ScriptResult = {
  output: string;
  xml: string;
};

class Rega extends EventEmitter {
  private tid: string = "REGA";
  private initialized: boolean = false;
  private static instance: Rega;
  private config: Config | null = null;
  private pendingRequests = 0;
  private x2j = new xml2js.Parser({ explicitArray: false });
  private readonly entities = [
    "foo",
    "channels",
    "datapoints",
    "devices",
    "rooms",
  ];
  private devices: HomematicDevices | null = null;
  private channels: HomematicChannels | null = null;
  private datapoints: HomematicDatapoints | null = null;
  private rooms: HomematicRooms | null = null;

  private constructor() {
    super();
  } // constructor()

  public static getInstance() {
    if (!Rega.instance) {
      Rega.instance = new Rega();
    }
    return Rega.instance;
  } // getInstance()

  public async init(config: Config) {
    this.config = config;
    if (this.initialized) {
      log.warn(`${this.tid} Already initialized`);
    }
    if (config.ccu.host && config.ssl.ca) {
      var requestOptions = {
        hostname: config.ccu.host,
        path: "/ise/checkrega.cgi",
        method: "GET",
      };
      // provide certificate authority to verify https cert
      https.globalAgent.options.ca = await fs.readFile(config.ssl.ca);

      let request = https.request(requestOptions, (response) => {
        response.on("data", (data) => {
          if (response.statusCode === 200 && data.toString() === "OK") {
            this.emit("ready");
          } else {
            this.emit("down");
          }
        });
        response.on("error", (error) => {
          this.emit("unreachable", error);
        });
      });
      request.end();

      this.initialized = true;
    } else {
      this.emit("error", `${this.tid} configuration incomplete`);
    }
  } // init()

  public async checkTime() {
    return new Promise<number>(async (resolve, reject) => {
      try {
        let result: ScriptResult = await this.runScript(
          'WriteLine(system.Date("%F %X").ToTime().ToInteger());'
        );
        let ccuTime = parseInt(result.output, 10);
        let localTime = Math.round(new Date().getTime() / 1000);
        let diff = localTime - ccuTime;
        resolve(diff);
      } catch (err) {
        reject(err);
      }
    });
  } // checkTime()

  public async load() {
    try {
      await this.loadFromFile();
    } catch (err) {}
  }

  private async loadFromFile() {
    return new Promise<void>(async (resolve, reject) => {
      for (let e in this.entities) {
        await this.read(this.entities[e]).catch(() => {
          reject();
        });
        break;
      }
      resolve();
    });
  }

  private read = async (fileName: string) => {
    return new Promise<void>(async (resolve, reject) => {
      let fullPath = `${__dirname}${path.sep}data${path.sep}${fileName}.json`;
      try {
        let stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          try {
            let data = await fs.readFile(fullPath);
            switch (fileName) {
              case "channels":
                this.channels = JSON.parse(data.toString());
                log.info(`${this.tid} ${fileName} successfully read`);
                resolve();
                break;
              case "datapoints":
                this.datapoints = JSON.parse(data.toString());
                log.info(`${this.tid} ${fileName} successfully read`);
                resolve();
                break;
              case "devices":
                this.devices = JSON.parse(data.toString());
                log.info(`${this.tid} ${fileName} successfully read`);
                resolve();
                break;
              case "rooms":
                this.rooms = JSON.parse(data.toString());
                log.info(`${this.tid} ${fileName} successfully read`);
                resolve();
                break;
              default:
                reject(`Failed reading rega data from file ${fullPath}`);
                break;
            }
          } catch (err) {
            reject(`${this.tid} Failed to read file ${fullPath}`);
          }
        } else {
          reject(`${this.tid} File doesn't exist: ${fullPath}`);
        }
      } catch (err) {
        reject(`${this.tid} Failed to read file: ${fullPath}`);
      }
    });
  };

  public async runScript(script: string) {
    return new Promise<ScriptResult>((resolve, reject) => {
      log.verbose(`${this.tid} running script: ${script}`);

      var requestOptions = {
        host: this.config!.ccu.host,
        port: "8181",
        path: "/foo.exe",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": script.length,
        },
      };
      this.pendingRequests += 1;
      var req = http.request(requestOptions, (res) => {
        var data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk.toString();
        });
        res.on("end", () => {
          this.pendingRequests -= 1;
          var pos = data.lastIndexOf("<xml>");
          var stdout = data.substring(0, pos);
          var xml = data.substring(pos);
          this.x2j.parseString(xml, (err, result) => {
            if (result && result.xml) {
              resolve({ output: stdout, xml: result.xml });
            } else {
              reject(`${this.tid} invalid response: ${data}`);
            }
          });
        });
      });
      req.on("error", (err) => {
        reject(`POST request failed (${err.message})`);
      });
      req.write(script);
      req.end();
    });
  } // runScript()

  public async runScriptFile(script: string) {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await fs.readFile(
          "../regascripts/" + script + ".fn",
          "utf8"
        );
        try {
          this.runScript(data);
          resolve(data);
        } catch (err) {
          reject(`Failed to run script (${err})`);
        }
      } catch (err) {
        reject(`Failed to read script file "${script}" (${err})`);
      }
    });
  } // runScriptFile()
}
