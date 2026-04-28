// Clean build script that handles Windows file locking issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function cleanAndBuild() {
  const nextDir = path.join(process.cwd(), '.next');

  console.log('Cleaning .next directory...');
  try {
    if (fs.existsSync(nextDir)) {
      // Try to remove with retries
      let retries = 3;
      while (retries > 0) {
        try {
          fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
          console.log('✓ .next directory removed');
          break;
        } catch (err) {
          retries--;
          if (retries === 0) {
            console.warn('⚠ Could not fully remove .next directory, but continuing...');
          } else {
            console.log(`Retrying removal (${retries} attempts left)...`);
            await sleep(2000);
          }
        }
      }
    } else {
      console.log('✓ .next directory does not exist');
    }
  } catch (err) {
    console.warn('⚠ Error cleaning .next:', err.message);
  }

  // Wait a bit to ensure file system is ready
  console.log('Waiting for file system to be ready...');
  await sleep(3000);

  console.log('\nBuilding Next.js application...');
  try {
    execSync('npx next build', { stdio: 'inherit' });
    console.log('\n✓ Build completed successfully!');
  } catch (err) {
    console.error('\n✗ Build failed');
    console.error('\n💡 Tip: If you see EBUSY errors, try:');
    console.error('   1. Stop any running dev servers (npm run dev)');
    console.error('   2. Temporarily disable antivirus/Windows Defender');
    console.error('   3. Exclude the project folder from real-time scanning');
    process.exit(1);
  }
}

cleanAndBuild();

