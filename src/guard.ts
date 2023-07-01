export { Guard };

enum ExitCode {
  SIGINT = 1,
  SIGTERM = 2,
  UNCAUGHT_EXCEPTION = 3,
  PANIC = 1000,
}

class Guard {
  tid: string;
  constructor(tid: string) {
    this.tid = tid;

    // ensure graceful shutdown
    process.on(
      "SIGTERM",
      this.shutdown.bind(null, "SIGTERM", ExitCode.SIGTERM)
    );
    process.on("SIGINT", this.shutdown.bind(null, "SIGINT", ExitCode.SIGINT));
    process.on("uncaughtException", (err) => {
      try {
        console.error(`${tid}: ${JSON.stringify(err.stack)}`);
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
  public shutdown(event: string, exitCode: number) {
    console.info(`${this.tid}: ${event} - shutting down...`);
    process.exit(exitCode);
  }
}
