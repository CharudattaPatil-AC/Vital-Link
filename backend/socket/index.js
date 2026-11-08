module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join room based on user role and ID
    socket.on('join', (data) => {
      if (!data) return;
      if (data.userId) {
        socket.join(`user_${data.userId}`);
        console.log(`Socket ${socket.id} joined room user_${data.userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
