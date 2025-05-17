console.log('Running postinstall script...');

// Check if we're in a Netlify build environment
const isNetlify = process.env.NETLIFY === 'true';

if (isNetlify) {
  console.log('Detected Netlify build environment');
  
  // Skip canvas installation if in Netlify environment
  process.env.CANVAS_SKIP_INSTALLATION = 'true';
  
  // Skip other problematic native dependencies
  process.env.SKIP_NATIVE_BUILDS = 'true';
}

console.log('Postinstall script completed successfully');