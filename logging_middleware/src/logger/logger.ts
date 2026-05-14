import {
    LevelType,
    LogPayload,
    PackageType,
    StackType,
  } from "../types/log.types.js";
  
  import { sendLog } from "../services/log.service.js";
  
  export const Log = async (
    stack: StackType,
    level: LevelType,
    packageName: PackageType,
    message: string
  ): Promise<void> => {
    const payload: LogPayload = {
      stack,
      level,
      package: packageName,
      message,
    };
  
    await sendLog(payload);
  };