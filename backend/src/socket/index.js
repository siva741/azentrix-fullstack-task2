const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a board room
    socket.on('join-board', (boardId) => {
      socket.join(boardId);
      console.log(`Socket ${socket.id} joined board ${boardId}`);
    });

    // Leave a board room
    socket.on('leave-board', (boardId) => {
      socket.leave(boardId);
      console.log(`Socket ${socket.id} left board ${boardId}`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocket };
