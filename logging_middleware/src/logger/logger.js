import { sendLog } from "../services/log.service.js";

export const Log = async (
  stack,
  level,
  packageName,
  message
) => {
  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  await sendLog(payload);
};
