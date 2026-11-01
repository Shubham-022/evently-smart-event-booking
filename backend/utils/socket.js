// backend/utils/socket.js
let io = null;

/**
 * Set the global Socket.IO server instance.
 * Called from backend/index.js after the HTTP server is created.
 */
export function setIo(serverIo) {
  io = serverIo;
}

/** Retrieve the stored Socket.IO instance. */
export function getIo() {
  return io;
}
