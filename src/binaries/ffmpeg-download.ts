import * as os from "os";

const FFMpegVersions: Record<string, Record<string, string>> = {
  Linux: {
    ia32: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/linux-ia32/ffmpeg",
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/linux-x64/ffmpeg",
  },
  Windows_NT: {
    ia32: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/win32-ia32/ffmpeg.exe",
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/win32-x64/ffmpeg.exe",
  },
  Darwin: {
    x64: "https://github.com/kribblo/node-ffmpeg-installer/raw/master/platforms/darwin-x64/ffmpeg",
  },
};

const FFProbeVersions: Record<string, Record<string, string>> = {
  Linux: {
    ia32: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/linux-ia32/ffprobe",
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/linux-x64/ffprobe",
  },
  Windows_NT: {
    ia32: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/win32-ia32/ffprobe.exe",
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/win32-x64/ffprobe.exe",
  },
  Darwin: {
    x64: "https://github.com/SavageCore/node-ffprobe-installer/raw/master/platforms/darwin-x64/ffprobe",
  },
};

export function getFFMpegURL(): string {
  const sys = os.type();
  const arch = os.arch();
  return FFMpegVersions[sys][arch];
}

export function getFFProbeURL(): string {
  const sys = os.type();
  const arch = os.arch();
  return FFProbeVersions[sys][arch];
}
