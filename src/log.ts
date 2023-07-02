/*
 *  Write log messages to console and file
 */
import fs from "fs";
import { Utils } from "./utils";

export interface LogConfig {
  console: {
    level: number;
    maxLength: number;
  };
  file: {
    level: number;
    maxLength: number;
    name: string;
  };
}

enum LogLevel {
  // errors only
  error = 1,
  // errors and warnings
  warn = 2,
  // errors, warnings and infos
  info = 3,
  // errors, warning, infos and time measurements
  time = 4,
  // errors, warning, infos, time measurements and debug messages
  debug = 5,
  // everything
  verbose = 6,
}

export class Log {
  private static tid = "LOG";
  private static file: fs.WriteStream;
  private static config: LogConfig;
  private static id: number = 0;
  private static startTime: Date[] = [];

  public static init(config: LogConfig) {
    Log.config = config;
    Log.file = fs.createWriteStream(Log.config.file.name, {
      flags: "a",
      // encoding: "utf8",
      // mode: 644,
    });
    Log.file.on("open", (fd) => {
      Log.info(`${this.tid} open`);
    });
    Log.file.on("close", () => {
      Log.info(`${this.tid} close`);
    });
    Log.file.on("error", (err) => {
      Log.error(`${this.tid} error: ${err.toString()}`);
    });
    Log.file.on("finish", () => {
      Log.info(`${this.tid} finish`);
    });
  }
  public static async end(message: string) {
    return new Promise<void>((resolve) => {
      Log.file.end(() => {
        resolve();
      });
    });
  }
  public static error(message: string) {
    this.write(LogLevel.error, message);
  }
  public static warn(message: string) {
    this.write(LogLevel.warn, message);
  }
  public static info(message: string) {
    this.write(LogLevel.info, message);
  }
  public static time(message: string, id?: number): number {
    if (id === undefined) {
      Log.id++;
      Log.startTime[Log.id] = new Date();
      Log.write(LogLevel.time, message);
      return Log.id;
    } else {
      if (this.startTime[id] !== undefined) {
        var t = new Date().getTime();
        var diff = t - Log.startTime[id].getTime();
        Log.write(
          LogLevel.time,
          message + " " + (diff / 1000).toString() + " s"
        );
        delete this.startTime[id];
      } else {
        Log.error("Invalid time id: " + id);
      }
      return id;
    }
  }
  public static debug(message: string) {
    this.write(LogLevel.debug, message);
  }
  public static verbose(message: string) {
    this.write(LogLevel.verbose, message);
  }
  private static write(level: number, message: string) {
    let msg: string;
    let msgFile;
    let msgConsole;

    if (typeof message !== "string") {
      msg = JSON.stringify(message);
    } else {
      msg = message.replace(/(\r\n|\n|\r)/gm, "");
    }

    let timestamp = Utils.getHumanReadableDateTime();
    let fullMsg = `${timestamp} [${LogLevel[level]}] ${msg}`;

    if (this.config.file && level <= this.config.file.level) {
      if (
        this.config.file.maxLength != -1 &&
        fullMsg.length > this.config.file.maxLength
      ) {
        fullMsg = fullMsg.slice(0, this.config.file.maxLength - 4) + " ...";
      }
      this.file.write(`${fullMsg}\n`);
    }

    fullMsg = `${timestamp} [${LogLevel[level]}] ${msg}`;
    if (this.config.console && level <= this.config.console.level) {
      if (
        this.config.console.maxLength != -1 &&
        fullMsg.length > this.config.console.maxLength
      ) {
        fullMsg = fullMsg.slice(0, this.config.console.maxLength - 4) + " ...";
      }
      console.log(fullMsg);
    }
  }
}
