/*
 *  Offset processing
 */
import fs from "fs";
import { Entity } from "./entityWrapper";
import { ISODate } from "./types";
import { Log as log } from "./log";
import { Map } from "./types";
import { MeasurementCache } from "./measurementCache";
import { Utils } from "./utils";

import offsets from "./data/offsets.json";
const offsetsFile = "./data/offsets.json";

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

class Offset {
  private cache: MeasurementCache;
  private static tid = "Offset";
  private offsets: Offsets = offsets;
  private map: Map;

  constructor(map: Map) {
    this.cache = new MeasurementCache();
    this.map = map;
  }

  public process(e: Entity): Boolean | null {
    if (e && this.exists(e)) {
      let overflowOrReset = this.detect(e);
      e.offset = this.getTotal(e);
      e.value = e.value + e.offset;
      return overflowOrReset;
    }
    return null;
  }

  private exists(e: Entity): Boolean | null {
    return (
      e &&
      this.offsets[e.device] !== undefined &&
      this.offsets[e.device][e.channel] !== undefined &&
      this.offsets[e.device][e.channel][e.datapoint] !== undefined
    );
  }

  private getTotal(e: Entity): number {
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

  private detect(e: Entity) {
    if (e) {
      let previous = this.cache.get(e);
      this.cache.put(e);
      if (previous) {
        if (previous > e.value) {
          this.store(
            e,
            Utils.round(
              previous,
              this.offsets[e.device][e.channel][e.datapoint].decimals
            ),
            new Date()
          );
          return true;
        }
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
