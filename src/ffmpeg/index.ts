import config from "../config";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(config.FFMPEG_PATH);
ffmpeg.setFfprobePath(config.FFPROBE_PATH);