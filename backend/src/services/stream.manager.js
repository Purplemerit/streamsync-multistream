const { startStream, stopStream } = require('./ffmpeg.service');
const { accountOutputKey } = require('../utils/platform.util');
const { cleanupTempVideo } = require('../utils/videoPath.util');

const activeSessions = {};

const snapshotSession = (session) => ({
  failedDestinations: new Set(session.failedDestinations),
  hadProgress: session.hadProgress,
  startedAt: session.startedAt,
  exitCode: session.exitCode ?? null,
});

const removeSession = (sessionId) => {
  const session = activeSessions[sessionId];
  if (session?.tempVideoPath) {
    cleanupTempVideo(session.tempVideoPath);
  }
  delete activeSessions[sessionId];
};

const startSession = (sessionId, videoPath, platforms, io, onError, onEnd, options = {}) => {
  const failedDestinations = new Set();
  const { tempVideoPath = null } = options;

  const command = startStream(
    videoPath,
    platforms,
    (progress) => {
      const session = activeSessions[sessionId];
      if (session) session.hadProgress = true;
      if (io) {
        io.to(sessionId).emit('stream:progress', {
          sessionId,
          timemark: progress.timemark,
          destinationCount: platforms.length,
          destinations: platforms.map((p) => ({
            platform: p.name,
            accountId: p.accountId,
            label: p.label,
            key: accountOutputKey(p),
          })),
        });
      }
    },
    (err, exitCode) => {
      const session = activeSessions[sessionId];
      const meta = session
        ? snapshotSession({ ...session, exitCode: exitCode ?? session.exitCode })
        : null;
      removeSession(sessionId);
      if (io) {
        io.to(sessionId).emit('stream:error', {
          sessionId,
          message: err.message,
        });
      }
      if (onError) onError(err, exitCode, meta);
    },
    (exitCode) => {
      const session = activeSessions[sessionId];
      const meta = session ? snapshotSession({ ...session, exitCode: exitCode ?? 0 }) : null;
      removeSession(sessionId);
      if (io) {
        io.to(sessionId).emit('stream:ended', { sessionId });
      }
      if (onEnd) onEnd(exitCode ?? 0, meta);
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
            if (io) {
              io.to(sessionId).emit('stream:destination:error', {
                sessionId,
                platform: p.name,
                accountId: p.accountId,
                label: p.label,
                key,
              });
            }
          }
        });
      }
    }
  );

  activeSessions[sessionId] = {
    command,
    startedAt: new Date(),
    platforms,
    failedDestinations,
    hadProgress: false,
    exitCode: null,
    stopRequested: false,
    tempVideoPath,
  };

  return command;
};

const stopSession = (sessionId) => {
  const session = activeSessions[sessionId];
  if (!session) return null;

  const meta = snapshotSession(session);

  if (!session.stopRequested) {
    session.stopRequested = true;
    stopStream(session.command);
  }

  return meta;
};

const endSession = (sessionId) => {
  removeSession(sessionId);
};

const getSession = (sessionId) => activeSessions[sessionId] || null;

const getFailedDestinations = (sessionId) =>
  activeSessions[sessionId]?.failedDestinations || new Set();

const getSessionSnapshot = (sessionId) => {
  const session = activeSessions[sessionId];
  return session ? snapshotSession(session) : null;
};

const getAllSessions = () =>
  Object.keys(activeSessions).map((id) => ({
    sessionId: id,
    startedAt: activeSessions[id].startedAt,
    platforms: activeSessions[id].platforms,
  }));

module.exports = {
  startSession,
  stopSession,
  endSession,
  getSession,
  getFailedDestinations,
  getSessionSnapshot,
  getAllSessions,
};
