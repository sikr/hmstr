import { Log as log } from "./log";
import { Utils } from "./utils";

export { Guard };

enum ExitCode {
  SIGINT = 1,
  SIGTERM = 2,
  UNCAUGHT_EXCEPTION = 3,
  PANIC = 1000,
}

class Guard {
  private tid: string;
  private static instance: Guard;
  private constructor(tid: string) {
    this.tid = tid;

    // ensure graceful shutdown
    process.on(
      "SIGTERM",
      this.shutdown.bind(this, "SIGTERM", ExitCode.SIGTERM)
    );
    process.on("SIGINT", this.shutdown.bind(this, "SIGINT", ExitCode.SIGINT));
    process.on("uncaughtException", (err) => {
      try {
        log.error(`${this.tid} ${JSON.stringify(err.stack)}`);
        this.shutdown.bind(
          null,
          "uncaughtException",
          ExitCode.UNCAUGHT_EXCEPTION
        );
      } catch (e) {
        process.exit(ExitCode.PANIC);
      }
    });
  }
  public static getInstance(tid: string) {
    if (!Guard.instance) {
      Guard.instance = new Guard(tid);
    }
    return Guard.instance;
  }
  public memoryUsage() {
    let usage = process.memoryUsage();
    log.info(
      `${this.tid} Memory rss=${Utils.round(
        usage.rss / 1024 / 1024,
        2
      )}, heapTotal=${Utils.round(
        usage.heapTotal / 1024 / 1024,
        2
      )}, heapUsed=${Utils.round(usage.heapUsed / 1024 / 1024, 2)}`
    );
  }
  public async shutdown(event: string, exitCode: number) {
    log.info(`${this.tid} ${event} - shutting down...`);
    await log.end("exit");
    process.exit(exitCode);
  }
}
