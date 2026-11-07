const { spawn } = require('child_process');

console.log('==================================================');
console.log('  🏥 STARTING LIFELINK FULL-STACK PLATFORM');
console.log('  • Backend API:  http://localhost:5000');
console.log('  • React Client: http://localhost:5173');
console.log('==================================================\n');

const backend = spawn('npm', ['run', 'dev', '--prefix', 'backend'], {
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('npm', ['run', 'dev', '--prefix', 'frontend'], {
  stdio: 'inherit',
  shell: true
});

function cleanup() {
  console.log('\nStopping LifeLink services...');
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
backend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Backend exited with code ${code}`);
  }
});
frontend.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Frontend exited with code ${code}`);
  }
});

