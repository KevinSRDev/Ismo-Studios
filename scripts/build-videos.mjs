// Genera renditions WebM VP9 de los mp4 de src/assets/videos/
// (usa ffmpeg). El mp4 original se conserva como opción "Máxima".
//
//   node scripts/build-videos.mjs
//
// Salidas: <stem>-hd.webm (720p ~1.4Mbps) · <stem>-sd.webm (480p ~700kbps)
import { readdir, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';

const DIR = path.resolve('src/assets/videos');

const jobs = (await readdir(DIR))
  .filter((f) => f.endsWith('.mp4'))
  .map((f) => {
    const stem = path.basename(f, '.mp4');
    return {
      in: path.join(DIR, f),
      out: [
        {
          file: path.join(DIR, `${stem}-hd.webm`),
          scale: null,
          bitrate: '1400k',
          maxrate: '1600k',
          bufsize: '2800k',
        },
        {
          file: path.join(DIR, `${stem}-sd.webm`),
          scale: '854:480',
          bitrate: '700k',
          maxrate: '800k',
          bufsize: '1400k',
        },
      ],
    };
  });

function ff(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args]);
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}`))));
  });
}

for (const job of jobs) {
  for (const r of job.out) {
    console.log(`→ ${path.basename(r.file)}`);
    await ff([
      '-i', job.in,
      '-c:a', 'libopus', '-b:a', '96k',
      '-c:v', 'libvpx-vp9',
      '-b:v', r.bitrate, '-maxrate', r.maxrate, '-bufsize', r.bufsize,
      '-row-mt', '1', '-cpu-used', '5',
      ...(r.scale ? ['-vf', `scale=${r.scale}:flags=lanczos`] : []),
      r.file,
    ].filter(Boolean));
    const { size } = await stat(r.file);
    console.log(`  ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
}
