declare namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      FRONTEND_URL?: string;
      USE_SIMULATION?: string;
      PLC_IP?: string;
      PLC_RACK?: string;
      PLC_SLOT?: string;
      PLC_CYCLE_TIME?: string;
      [key: string]: string | undefined;
    }
  }