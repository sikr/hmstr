/*
 * Lowbat - Lowbat capturing and storage
 *
 *   When a device reports low battery this is captured and stored in a file
 *   (data/lowbat.json). Sometimes low battery state disappears shortly after it
 *   occured. This may happen when the battery (voltage) temporarely recovers
 *   for another while until it ultimately reaches low battery state. This is
 *   considered with a 60 days jitter test.
 *
 */
import fs from "fs";
import { Entity } from "./entityWrapper";
import { ISODate } from "./types";
import { Log as log } from "./log";
import { Utils } from "./utils";

import lowbat from "./data/lowbat.json";
const lowbatFile = "./data/lowbat.json";

// Overflow or rest event
type Event = {
  replacement: ISODate;
  duration: String;
};

// Lowbat JSON file data structure
export type LowbatJson = {
  [device: string]: {
    events: Event[];
  };
};

// channel: 0;
// datapoint: "LOWBAT";
// device: "UNITEMP001";
// timestamp: 1710088926739;
// value: false;

// channel: 0
// datapoint: 'LOWBAT'
// device: 'NEQ0936048'
// timestamp: 1710089113560
// value: true

export class Lowbat {
  private static instance: Lowbat;
  private static tid = "LOWBAT";
  private static lowbat: LowbatJson = lowbat;

  private constructor() {}

  public static getInstance(): Lowbat {
    if (!Lowbat.instance) {
      Lowbat.instance = new Lowbat();
    }
    return Lowbat.instance;
  }

  public static handle(e: Entity) {
    let now = new Date();
    let modified = false;
    if (e) {
      if (e.value === true) {
        if (!this.lowbat[e.device]) {
          this.lowbat[e.device] = {
            events: [],
          };
        }
        let event: Event =
          this.lowbat[e.device].events[this.lowbat[e.device].events.length - 1];
        if (!event || event.replacement !== "") {
          let date;
          if (event) {
            date = new Date(event.replacement);
          }
          // Some devices seem to have a lowbat true/false jitter, so only
          // lowbat=false events lasting for more than 60 days are presereved
          if (date && now.valueOf() - date.valueOf() < 5184000000) {
            // discard jitter
            event.replacement = "";
            modified = true;
            log.info(
              `${Lowbat.tid} ${e.device} battery low jitter detected.`
            );
          } else {
            // stringify battery duration
            if (event && date) {
              event.duration = Utils.getHumanReadableTimeSpan(now, date);
              log.info(
                `${Lowbat.tid} ${e.device} determined battery duration is ` +
                `${event.duration}.`
              );
            }
            // new lowbat event
            this.lowbat[e.device].events.push({
              replacement: "",
              duration: "",
            });
            modified = true;
            log.info(`${Lowbat.tid} ${e.device} reports lowbat.`);
          }
        }
      } else {
        if (this.lowbat[e.device] && this.lowbat[e.device].events) {
          let event =
            this.lowbat[e.device].events[
              this.lowbat[e.device].events.length - 1
            ];
          if (event && event.replacement === "") {
            // battery replaced
            event.replacement = now.toISOString();
            modified = true;
            log.info(
              `${Lowbat.tid} ${e.device} battery has been replaced.`
            );
          }
        }
      }
      if (modified) {
        fs.writeFile(
          lowbatFile,
          JSON.stringify(this.lowbat, null, 2),
          (err) => {
            if (err) {
              log.error(`${Lowbat.tid} Writing lowbat file failed: ${err}`);
            }
          }
        );
      }
    }
  }
}
