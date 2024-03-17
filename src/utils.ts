/*
 *  Utils
 */

export { Utils };

class Utils {
  public static round(value: number, decimals: number) {
    let decimalsFactor = Math.pow(10, decimals);
    return Math.round(value * decimalsFactor) / decimalsFactor;
  }
  public static getHumanReadableDateTime(time?: Date) {
    var d;
    if (time !== undefined) {
      d = new Date(time);
    } else {
      d = new Date();
    }

    return (
      this.fill(d.getFullYear().toString(), 4) +
      "-" +
      this.fill((d.getMonth() + 1).toString(), 2) +
      "-" +
      this.fill(d.getDate().toString(), 2) +
      " " +
      this.fill(d.getHours().toString(), 2) +
      ":" +
      this.fill(d.getMinutes().toString(), 2) +
      ":" +
      this.fill(d.getSeconds().toString(), 2)
    );
  }
  public static getHumanReadableTimeSpan = function (
    begin: Date,
    end: Date
  ): String {
    if (begin && end) {
      let delta =
        Math.abs(end.getMilliseconds() - begin.getMilliseconds()) / 1000;
      let days = Math.floor(delta / 86400);
      delta -= days * 86400;
      let hours = Math.floor(delta / 3600) % 24;
      delta -= hours * 3600;
      let minutes = Math.floor(delta / 60) % 60;
      delta -= minutes * 60;
      let seconds = Math.round(delta);
      return (
        days +
        " days, " +
        hours +
        " hours, " +
        minutes +
        " minutes, " +
        seconds +
        " seconds"
      );
    }
    return "";
  };
  private static fill(text: string, length: number) {
    let s = "";
    while (text.length + s.length < length) {
      s += "0";
    }
    return s + text;
  }
}
