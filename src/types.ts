export type Persistence = {
  [device: string]: {
    [channel: string]: {
      [datapoint: string]: {
        homematic: string,
        graphite: string
      }
    }
  }
}
