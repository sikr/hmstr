/*
 *  Value caching
 *
 *  Just a simple cache to store measured values.
 *
 *
 *
 *
 *
 */

import { Entity } from "./entityWrapper";

type Cache = {
  device: string;
  value: number;
};

export class MeasurementCache {
  cache: Cache[] = [];
  public get(entity: Entity): number | undefined {
    if (entity && entity.device) {
      for (let i = 0; i < this.cache.length; i++) {
        if (this.cache[i].device === entity.device) {
          return this.cache[i].value;
        }
      }
    }
    return undefined;
  }
  public put(entity: Entity) {
    if (entity) {
      for (let i = 0; i < this.cache.length; i++) {
        if (this.cache[i].device === entity.device) {
          this.cache[i].value = entity.value as number;
          return;
        }
      }
      this.cache.push({
        device: entity.device,
        value: entity.value as number,
      });
    }
  }
}
