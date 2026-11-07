// Utility to provide Indian Standard Time (IST = UTC + 5:30)

const getISTDate = () => {
  // IST offset is +5 hours 30 mins
  return new Date(Date.now() + (5.5 * 60 * 60 * 1000));
};

const getISTString = () => {
  return new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
    hour12: true
  });
};

module.exports = {
  getISTDate,
  getISTString
};
