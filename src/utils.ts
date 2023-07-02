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
  private static fill(text: string, length: number) {
    let s = "";
    while (text.length + s.length < length) {
      s += "0";
    }
    return s + text;
  }
}
