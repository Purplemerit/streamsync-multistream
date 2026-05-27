const { startStream, stopStream } = require('./ffmpeg.service');
const { accountOutputKey } = require('../utils/platform.util');

const activeSessions = {};

const startSession = (sessionId, videoPath, platforms, io, onError, onEnd) => {
  const failedDestinations = new Set();

  const command = startStream(
    videoPath,
    platforms,
    (progress) => {
      if (io) {
        io.to(sessionId).emit('stream:progress', {
          sessionId,
          timemark: progress.timemark,
        });
      }
    },
    (err) => {
      delete activeSessions[sessionId];
      if (io) {
        io.to(sessionId).emit('stream:error', {
          sessionId,
          message: err.message
        });
      }
      if (onError) onError(err);
    },
    () => {
      delete activeSessions[sessionId];
      if (io) {
        io.to(sessionId).emit('stream:ended', { sessionId });
      }
      if (onEnd) onEnd();
    },
    (stderrLine) => {
      if (stderrLine.includes('Slave') && stderrLine.includes('error')) {
        platforms.forEach((p) => {
          const keyMatch =
            (p.streamKey && stderrLine.includes(p.streamKey.substring(0, 20))) ||
            (p.rtmpUrl && stderrLine.includes(p.rtmpUrl.substring(0, 30)));
          if (keyMatch) {
            const key = accountOutputKey(p);
            failedDestinations.add(key);
            console.log(`Destination marked as failed: ${key}`);
          }
        });
      }
    }
  );

  activeSessions[sessionId] = {
    command,
    startedAt: new Date(),
    platforms,
    failedDestinations
  };

  return command;
};

const stopSession = (sessionId) => {
  const session = activeSessions[sessionId];
  if (session) {
    stopStream(session.command);
    delete activeSessions[sessionId];
    return true;
  }
  return false;
};

const getSession = (sessionId) => activeSessions[sessionId] || null;

const getFailedDestinations = (sessionId) =>
  activeSessions[sessionId]?.failedDestinations || new Set();

const getAllSessions = () =>
  Object.keys(activeSessions).map((id) => ({
    sessionId: id,
    startedAt: activeSessions[id].startedAt,
    platforms: activeSessions[id].platforms
  }));

module.exports = {
  startSession,
  stopSession,
  getSession,
  getFailedDestinations,
  getAllSessions
};
