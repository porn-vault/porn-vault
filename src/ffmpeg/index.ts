import config from "../config";
import ffmpeg from "fluent-ffmpeg";

if (config.FFMPEG_PATH)
  ffmpeg.setFfmpegPath(config.FFMPEG_PATH);

if (config.FFPROBE_PATH)
  ffmpeg.setFfprobePath(config.FFPROBE_PATH);