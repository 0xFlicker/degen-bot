import { Logger, LogLevel, logLevels } from "lambda-logger-node";

function isLogLevel(level: string | undefined): level is LogLevel {
  return !!level && logLevels.includes(level);
}

export const createLogger = (() => {
  let instance: ReturnType<typeof Logger> | undefined = undefined;
  return () => {
    if (!instance) {
      instance = Logger({
        minimumLogLevel: isLogLevel(process.env.MINIMUM_LOG_LEVEL)
          ? process.env.MINIMUM_LOG_LEVEL
          : "INFO",
        forceGlobalErrorHandler: false,
        useGlobalErrorHandler: false,
      });
    }
    return instance;
  };
})();
