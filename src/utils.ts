/*
 *  Utils
 */

export { Utils };

class Utils {
  public static round(value: number, decimals: number) {
    let decimalsFactor = Math.pow(10, decimals);
    return Math.round(value * decimalsFactor) / decimalsFactor;
  }
}
