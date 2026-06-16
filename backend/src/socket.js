let _io = null;

export function setIo(io) {
  _io = io;
}

export function emitToOwner(ownerId, event, data) {
  if (_io) _io.to(`owner:${ownerId}`).emit(event, data);
}

export function emitPublic(event, data) {
  if (_io) _io.to('public').emit(event, data);
}
