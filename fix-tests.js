const fs = require('fs');
const path = require('path');
const glob = require('glob');

// All controller spec files I created (excluding pre-existing auth, users, site)
const files = glob.sync('src/modules/**/**.controller.spec.ts').filter(f => 
  !f.includes('auth/') && !f.includes('users/') && !f.includes('site/')
);

console.log('Files to fix:', files.length);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Skip if already has overrideGuard
  if (content.includes('overrideGuard')) {
    console.log('SKIP (already has override):', file);
    continue;
  }
  
  // Add AuthGuard import if missing
  if (!content.includes('AuthGuard')) {
    // Find the last import line and add AuthGuard import after it
    const importRegex = /^import .+ from .+;$/gm;
    let lastImportEnd = 0;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      lastImportEnd = match.index + match[0].length;
    }
    
    // Determine the correct relative path to auth.guard
    const fileDir = path.dirname(file);
    const guardPath = 'src/common/guards/auth.guard';
    let relativePath = path.relative(fileDir, guardPath).replace(/\\/g, '/');
    if (!relativePath.startsWith('.')) relativePath = './' + relativePath;
    
    const importLine = '\nimport { AuthGuard } from "' + relativePath + '";';
    content = content.slice(0, lastImportEnd) + importLine + content.slice(lastImportEnd);
  }
  
  // Replace }).compile() with override chain
  content = content.replace(
    /(\s*)}\)\.compile\(\)/g,
    '$1})\n$1  .overrideGuard(AuthGuard)\n$1  .useValue({ canActivate: () => true })\n$1  .compile()'
  );
  
  fs.writeFileSync(file, content);
  console.log('FIXED:', file);
}
