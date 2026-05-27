const { spawn } = require('child_process');
const platformsConfig = require('../config/platforms.config');
const { accountOutputKey, RTMPS_PLATFORMS } = require('../utils/platform.util');

const FFMPEG_PATH = process.env.FFMPEG_PATH || 'ffmpeg';

const buildRtmpUrl = (platform, streamKey, customRtmpUrl) => {
  const config = platformsConfig[platform.name];
  let baseUrl = customRtmpUrl || config?.rtmpUrl;

  if (platform.name === 'instagram') {
    let key = streamKey || '';
    if (key.startsWith('rtmp://') || key.startsWith('rtmps://')) {
      const fullUrl = key.replace('rtmp://', 'rtmps://');
      console.log(`[${accountOutputKey(platform)}] instagram: ${fullUrl.substring(0, 70)}...`);
      return fullUrl;
    }
    if (!baseUrl) throw new Error('Instagram requires RTMP URL');
    if (!baseUrl.startsWith('rtmps://')) {
      baseUrl = baseUrl.replace('rtmp://', 'rtmps://');
    }
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const fullUrl = `${cleanBase}${key}`;
    console.log(`[${accountOutputKey(platform)}] instagram: ${fullUrl.substring(0, 70)}...`);
    return fullUrl;
  }

  if (!baseUrl) throw new Error(`No RTMP URL for platform: ${platform.name}`);

  if (platform.name === 'kick') {
    if (!baseUrl.startsWith('rtmps://')) {
      baseUrl = 'rtmps://' + baseUrl.replace('rtmp://', '');
    }
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    const fullUrl = `${cleanBase}app/${streamKey}`;
    console.log(`[${accountOutputKey(platform)}] kick: ${fullUrl.substring(0, 70)}...`);
    return fullUrl;
  }

  if (!baseUrl.startsWith('rtmps://')) {
    baseUrl = baseUrl.replace('rtmps://', 'rtmp://');
  }
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
  const fullUrl = `${cleanBase}${streamKey}`;
  const label = platform.label ? `${platform.name} (${platform.label})` : platform.name;
  console.log(`[${accountOutputKey(platform)}] ${label}: ${fullUrl.substring(0, 70)}...`);
  return fullUrl;
};

const buildTeeEntry = (platform, streamKey, customRtmpUrl) => {
  const rtmpUrl = buildRtmpUrl(platform, streamKey, customRtmpUrl);
  if (RTMPS_PLATFORMS.has(platform.name)) {
    return `[f=flv:onfail=ignore:tls_verify=0]${rtmpUrl}`;
  }
  return `[f=flv:onfail=ignore]${rtmpUrl}`;
};

/**
 * Stream one video to many destinations (one tee branch per account).
 * `platforms` is a flat list: multiple entries with the same `name` are allowed.
 */
const startStream = (videoPath, platforms, onProgress, onError, onEnd, onStderr) => {
  if (!platforms?.length) {
    throw new Error('At least one stream destination is required');
  }

  const outputs = platforms
    .map((p) => buildTeeEntry(p, p.streamKey, p.rtmpUrl))
    .join('|');

  const args = [
    '-re',
    '-stream_loop', '-1',
    '-i', videoPath,
    '-c:v', 'libx264',
    '-b:v', '1500k',
    '-maxrate', '1500k',
    '-bufsize', '3000k',
    '-vf', 'scale=1280:720',
    '-r', '30',
    '-g', '60',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
    '-b:a', '128k',
    '-ar', '44100',
    '-f', 'tee',
    '-map', '0:v',
    '-map', '0:a',
    outputs
  ];

  const destinations = platforms.map((p) => ({
    key: accountOutputKey(p),
    name: p.name,
    label: p.label,
  }));

  console.log(`Starting stream to ${platforms.length} destination(s):`);
  destinations.forEach((d) => console.log(`  - ${d.key} (${d.label || d.name})`));
  console.log('FFmpeg tee output:', outputs.substring(0, 200));

  const process = spawn(FFMPEG_PATH, args);

  process.stderr.on('data', (data) => {
    const line = data.toString();

    if (line.includes('time=')) {
      const match = line.match(/time=(\S+)/);
      if (match && onProgress) onProgress({ timemark: match[1] });
    }

    if (
      line.includes('Error') || line.includes('error') ||
      line.includes('failed') || line.includes('Failed') ||
      line.includes('Slave') || line.includes('Output #0')
    ) {
      console.error('FFmpeg stderr:', line.trim());
      if (onStderr) onStderr(line, platforms);
    }
  });

  process.on('close', (code) => {
    console.log(`FFmpeg exited with code ${code}`);
    if (code === 0) {
      if (onEnd) onEnd();
    } else if (code !== null) {
      if (onError) onError(new Error(`FFmpeg exited with code ${code}`));
    }
  });

  process.on('error', (err) => {
    console.error('FFmpeg spawn error:', err.message);
    if (onError) onError(err);
  });

  console.log('FFmpeg process started successfully');
  return process;
};

const stopStream = (process) => {
  if (process) {
    try {
      process.kill('SIGKILL');
      console.log('FFmpeg process killed successfully');
    } catch (err) {
      console.error('Error killing FFmpeg:', err.message);
    }
  }
};

module.exports = { startStream, stopStream, accountOutputKey };
