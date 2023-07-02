/*
 *  Offset processing
 */
import fs from "fs";
import offsets from "./data/offsets.json";
import { Map } from "./types";
import { Utils } from "./utils";
import { Entity } from "./entityWrapper";
import { ISODate } from "./types";
import { Log as log } from "./log";

// Overflow or rest event
type Event = {
  comment: string;
  date?: ISODate;
  value: number;
};

// Offsets file data structure
export type Offsets = {
  [device: string]: {
    [channel: string]: {
      [datapoint: string]: {
        overflow: number;
        decimals: number;
        events: Event[];
      };
    };
  };
};

export { Offset };

const offsetsFile = "./data/offsets.json";

class Offset {
  private static tid = "Offset";
  private offsets: Offsets = offsets;
  private map: Map;

  constructor(map: Map) {
    this.map = map;
  }

  public exists(e: Entity): Boolean | null {
    return (
      e &&
      this.offsets[e.device] !== undefined &&
      this.offsets[e.device][e.channel] !== undefined &&
      this.offsets[e.device][e.channel][e.datapoint] !== undefined
    );
  }

  private getPersistedValue(e: Entity): number {
    if (
      e &&
      this.map[e.device] &&
      this.map[e.device][e.channel] &&
      this.map[e.device][e.channel][e.datapoint] &&
      this.map[e.device][e.channel][e.datapoint].value &&
      this.map[e.device][e.channel][e.datapoint].value
    ) {
      return this.map[e.device][e.channel][e.datapoint].value || 0;
    }
    return 0;
  }

  public getTotal(e: Entity): number {
    let total = 0;
    if (e) {
      try {
        if (this.exists(e)) {
          let events = this.offsets[e.device][e.channel][e.datapoint].events;
          for (var i in events) {
            total += events[i].value;
          }
        }
      } catch (err) {
        log.error(
          `${Offset.tid} Calculating offset for datapoint ${e.datapoint}`
        );
      }
      return total;
    }
    log.error(`${Offset.tid} Entity is undefined`);
    return 0;
  }

  public checkOverflowOrReset(
    e: Entity,
    currentValue: number,
    timestamp: Date
  ) {
    if (e) {
      let previousValue = this.getPersistedValue(e);
      if (previousValue && currentValue < previousValue) {
        // current value is less than former value, which indicates
        // overflow or reset (e. g. battery exchange)
        this.store(
          e,
          Utils.round(
            this.map[e.device][e.channel][e.datapoint].value!,
            this.offsets[e.device][e.channel][e.datapoint].decimals
          ),
          timestamp
        );
        return true;
      }
    }
    return false;
  }

  private store(e: Entity, offset: number, timestamp: Date) {
    try {
      if (e && this.exists(e)) {
        this.offsets[e.device][e.channel][e.datapoint].events.push({
          comment: "automatically captured overflow or reset",
          date: timestamp.toISOString(),
          value: offset,
        });
        this.writeFile();
      }
    } catch (err) {
      if (e) {
        log.error(`${Offset.tid} Adding offset for datapoint ${e.datapoint}`);
      } else {
        log.error(
          `${Offset.tid} Adding offset for datapoint; entity is undefined`
        );
      }
    }
  }

  private writeFile() {
    try {
      fs.writeFile(offsetsFile, JSON.stringify(offsets, null, 2), (err) => {
        if (err) throw err;
        log.debug("${Offset.tid} Data written to file");
      });
    } catch (err) {
      log.error(`${Offset.tid} Write offsets file. ${err}`);
    }
  }
}
