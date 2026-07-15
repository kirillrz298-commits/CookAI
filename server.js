import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsxBinary = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'tsx.cmd' : 'tsx');

console.log('Starting CookBook AI server via tsx...');

const child = spawn(tsxBinary, [path.join(__dirname, 'server/index.ts')], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('Failed to start tsx:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Server process exited with code ${code}`);
  process.exit(code || 0);
});
