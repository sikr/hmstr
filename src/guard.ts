import { Log as log } from "./log";
export { Guard };

enum ExitCode {
  SIGINT = 1,
  SIGTERM = 2,
  UNCAUGHT_EXCEPTION = 3,
  PANIC = 1000,
}

class Guard {
  private static tid: string;
  constructor(tid: string) {
    tid = tid;

    // ensure graceful shutdown
    process.on(
      "SIGTERM",
      this.shutdown.bind(this, "SIGTERM", ExitCode.SIGTERM)
    );
    process.on("SIGINT", this.shutdown.bind(this, "SIGINT", ExitCode.SIGINT));
    process.on("uncaughtException", (err) => {
      try {
        log.error(`${Guard.tid} ${JSON.stringify(err.stack)}`);
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
  public async shutdown(event: string, exitCode: number) {
    log.info(`${Guard.tid} ${event} - shutting down...`);
    await log.end("exit");
    process.exit(exitCode);
  }
}
