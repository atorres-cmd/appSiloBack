// src/utils/logger.ts

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    crimson: "\x1b[38m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    crimson: "\x1b[48m"
  }
};

export const logger = {
  info: (message: string) => {
    console.log(`${colors.fg.blue}[INFO]${colors.reset} ${message}`);
  },
  success: (message: string) => {
    console.log(`${colors.fg.green}[SUCCESS]${colors.reset} ${message}`);
  },
  warn: (message: string) => {
    console.log(`${colors.fg.yellow}[WARN]${colors.reset} ${message}`);
  },
  error: (message: string, error?: any) => {
    console.error(`${colors.fg.red}[ERROR]${colors.reset} ${message}`);
    if (error) {
      console.error(error);
    }
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${colors.fg.magenta}[DEBUG]${colors.reset} ${message}`);
      if (data) {
        console.log(data);
      }
    }
  }
};
