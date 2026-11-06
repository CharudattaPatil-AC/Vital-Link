const fs = require('fs');
const path = require('path');

function scanCodebase() {
  const rootDir = path.resolve(__dirname, '../../');
  const backendDir = path.join(rootDir, 'backend');
  const frontendDir = path.join(rootDir, 'frontend');

  // 1. Scan Routes
  const routesDir = path.join(backendDir, 'routes');
  const routeFiles = fs.existsSync(routesDir) ? fs.readdirSync(routesDir) : [];

  // 2. Scan Models
  const modelsDir = path.join(backendDir, 'models');
  const modelFiles = fs.existsSync(modelsDir) ? fs.readdirSync(modelsDir) : [];

  // 3. Scan Pages
  const pagesDir = path.join(frontendDir, 'src/pages');
  const pageFiles = fs.existsSync(pagesDir) ? fs.readdirSync(pagesDir) : [];

  // 4. Scan Components
  const componentsDir = path.join(frontendDir, 'src/components');
  const componentFiles = fs.existsSync(componentsDir) ? fs.readdirSync(componentsDir) : [];

  // 5. Scan Dependencies
  const backendPkg = JSON.parse(fs.readFileSync(path.join(backendDir, 'package.json'), 'utf8'));
  const frontendPkg = JSON.parse(fs.readFileSync(path.join(frontendDir, 'package.json'), 'utf8'));

  console.log('\n======================================================');
  console.log('  LIFELINK CODEBASE AUDIT FOR README DOCUMENTATION');
  console.log('======================================================');
  console.log(`✓ Backend Routes (${routeFiles.length}):`, routeFiles.join(', '));
  console.log(`✓ Database Models (${modelFiles.length}):`, modelFiles.join(', '));
  console.log(`✓ Frontend Pages (${pageFiles.length}):`, pageFiles.join(', '));
  console.log(`✓ Core UI Components (${componentFiles.length}):`, componentFiles.join(', '));
  console.log(`✓ Backend Dependencies:`, Object.keys(backendPkg.dependencies || {}).join(', '));
  console.log(`✓ Frontend Dependencies:`, Object.keys(frontendPkg.dependencies || {}).join(', '));

  // Check README.md
  const readmePath = path.join(rootDir, 'README.md');
  if (fs.existsSync(readmePath)) {
    const readmeContent = fs.readFileSync(readmePath, 'utf8');
    const missingPages = pageFiles.filter(p => !readmeContent.includes(p.replace('.jsx', '')));
    const missingModels = modelFiles.filter(m => !readmeContent.includes(m.replace('.js', '')));

    console.log('\n--- README Coverage Analysis ---');
    if (missingPages.length === 0 && missingModels.length === 0) {
      console.log('✓ README.md is in sync with all models and primary pages!');
    } else {
      if (missingPages.length > 0) console.log('⚠️ Pages to verify in README:', missingPages);
      if (missingModels.length > 0) console.log('⚠️ Models to verify in README:', missingModels);
    }
  }
  console.log('======================================================\n');
}

scanCodebase();

