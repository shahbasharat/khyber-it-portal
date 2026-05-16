import pino from "pino";
import pinoPretty from "pino-pretty";

const logger = pino(
  {
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    base: {
      env: process.env.NODE_ENV,
    },
  },
  process.env.NODE_ENV === "production"
    ? undefined
    : pinoPretty({
        colorize: true,
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname",
      })
);

export default logger;
