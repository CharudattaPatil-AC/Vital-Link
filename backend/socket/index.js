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
      // if (data.facilityId) {
      //   socket.join(`facility_${data.facilityId}`);
      //   console.log(`Socket ${socket.id} joined room facility_${data.facilityId}`);
      // }
      // if (data.role === 'donor') {
      //   socket.join('donors');
      //   console.log(`Socket ${socket.id} joined donors room`);
      // }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
