import { spawn } from "child_process";
import { arch } from "os";
import * as logger from "./logger";

export const twigsPath = arch() == "Windows_NT" ? "twigs.exe" : "twigs";

export function spawnTwigs() {
  return new Promise((resolve, reject) => {
    const twigs = spawn("./" + twigsPath, []);

    let responded = false;

    twigs.stdout.on("data", data => {
      if (!responded) {
        logger.log("Twigs ready");
        responded = true;
        resolve();
      }
    });
  });
}
