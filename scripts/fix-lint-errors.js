const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Function to fix unused imports and variables
function fixUnusedImportsAndVariables(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Get all the unused variables from the file using eslint
    const output = execSync(`npx eslint "${filePath}" --format json`, { encoding: 'utf8' });
    const lintResults = JSON.parse(output);
    
    if (lintResults.length === 0 || !lintResults[0].messages) {
      return;
    }
    
    // Find all unused variables
    const unusedVars = lintResults[0].messages
      .filter(msg => msg.ruleId === '@typescript-eslint/no-unused-vars')
      .map(msg => msg.message.match(/'([^']+)'/)[1]);
    
    if (unusedVars.length === 0) {
      return;
    }
    
    // Remove unused imports
    unusedVars.forEach(varName => {
      // Remove entire import if it's a single import
      const singleImportRegex = new RegExp(`import\\s+{?\\s*${varName}\\s*}?\\s+from\\s+['"][^'"]+['"];?\\n?`, 'g');
      content = content.replace(singleImportRegex, '');
      
      // Remove from multi-import
      const multiImportRegex = new RegExp(`import\\s+{([^}]*)${varName}([^}]*)}\\s+from\\s+['"][^'"]+['"];?`, 'g');
      content = content.replace(multiImportRegex, (match, before, after) => {
        // Clean up the import list
        const importList = `${before}${after}`.replace(/,\s*,/g, ',').replace(/,\s*}/g, '}').replace(/{,/g, '{').replace(/,\s*$/, '');
        if (importList.replace(/\s/g, '') === '{}') {
          return ''; // Remove the entire import if it's empty
        }
        return `import {${importList}} from ${match.split('from')[1]}`;
      });
      
      // Comment out unused variable declarations
      const varDeclarationRegex = new RegExp(`(const|let|var)\\s+${varName}\\s*=`, 'g');
      content = content.replace(varDeclarationRegex, '// $1 ' + varName + ' =');
      
      // Comment out unused function parameters
      const funcParamRegex = new RegExp(`\\(([^)]*)${varName}([^)]*)\\)`, 'g');
      content = content.replace(funcParamRegex, (match, before, after) => {
        return `(${before}/* ${varName} */${after})`;
      });
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unused variables in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to fix any types
function fixAnyTypes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace common any types with more specific types
    content = content.replace(/: any(\s*)(=|;|\)|\}|,)/g, ': unknown$1$2');
    content = content.replace(/: any\[\]/g, ': unknown[]');
    
    // Fix function parameters with any
    content = content.replace(/\((.*?): any(.*?)\)/g, '($1: unknown$2)');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed any types in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to fix unescaped entities
function fixUnescapedEntities(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace unescaped entities
    content = content.replace(/(\s)'(\s)/g, "$1&apos;$2");
    content = content.replace(/(\w)'(\w)/g, "$1&apos;$2");
    content = content.replace(/(\w)'(\s)/g, "$1&apos;$2");
    content = content.replace(/(\s)'(\w)/g, "$1&apos;$2");
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed unescaped entities in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to fix useEffect dependencies
function fixUseEffectDeps(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Find useEffect hooks with missing dependencies
    const useEffectRegex = /useEffect\(\s*\(\)\s*=>\s*{([\s\S]*?)}\s*,\s*\[(.*?)\]\s*\)/g;
    content = content.replace(useEffectRegex, (match, body, deps) => {
      // Extract function calls from the body
      const functionCalls = body.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\(/g) || [];
      const functionNames = functionCalls.map(call => call.slice(0, -1));
      
      // Add missing dependencies
      const uniqueFunctions = [...new Set(functionNames)];
      const missingDeps = uniqueFunctions.filter(fn => 
        !deps.includes(fn) && 
        !['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo'].includes(fn)
      );
      
      if (missingDeps.length > 0) {
        const newDeps = deps ? `${deps}${deps.trim() ? ', ' : ''}${missingDeps.join(', ')}` : missingDeps.join(', ');
        return `useEffect(() => {${body}}, [${newDeps}])`;
      }
      
      return match;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed useEffect dependencies in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Function to fix img tags
function fixImgTags(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if Next.js Image is already imported
    const hasImageImport = content.includes("import Image from 'next/image'") || 
                          content.includes('import { Image } from "next/image"') ||
                          content.includes('import { Image } from \'next/image\'');
    
    // Add Image import if needed
    if (!hasImageImport && content.includes('<img')) {
      const importStatement = "import Image from 'next/image';\n";
      // Find a good place to add the import
      if (content.includes('import')) {
        // Add after the last import
        const lastImportIndex = content.lastIndexOf('import');
        const endOfImportLine = content.indexOf('\n', lastImportIndex) + 1;
        content = content.slice(0, endOfImportLine) + importStatement + content.slice(endOfImportLine);
      } else {
        // Add at the beginning of the file
        content = importStatement + content;
      }
    }
    
    // Replace img tags with Image components
    content = content.replace(/<img([^>]*)>/g, (match, attributes) => {
      // Extract src and other attributes
      const srcMatch = attributes.match(/src=["']([^"']*)["']/);
      const altMatch = attributes.match(/alt=["']([^"']*)["']/);
      const classMatch = attributes.match(/class=["']([^"']*)["']/);
      const styleMatch = attributes.match(/style=["']([^"']*)["']/);
      
      if (!srcMatch) return match; // If no src, keep original
      
      const src = srcMatch[1];
      const alt = altMatch ? altMatch[1] : 'Image';
      const className = classMatch ? ` className="${classMatch[1]}"` : '';
      const style = styleMatch ? ` style={${styleMatch[1]}}` : '';
      
      // Create Image component
      return `<Image src="${src}" alt="${alt}"${className}${style} width={500} height={300} />`;
    });
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed img tags in ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
  }
}

// Main function to process all files
async function fixLintErrors() {
  // Get the list of files with errors from the build log
  const buildLog = fs.readFileSync(path.resolve(__dirname, '../build_log.txt'), 'utf8');
  const fileRegex = /\.\/([^\s]+)\n/g;
  const files = [];
  let match;
  
  while ((match = fileRegex.exec(buildLog)) !== null) {
    const filePath = match[1];
    if (!files.includes(filePath)) {
      files.push(filePath);
    }
  }
  
  // Process each file
  for (const file of files) {
    const fullPath = path.resolve(__dirname, '../src', file);
    
    if (fs.existsSync(fullPath)) {
      console.log(`Processing ${fullPath}`);
      fixUnusedImportsAndVariables(fullPath);
      fixAnyTypes(fullPath);
      fixUnescapedEntities(fullPath);
      fixUseEffectDeps(fullPath);
      fixImgTags(fullPath);
    } else {
      console.warn(`File not found: ${fullPath}`);
    }
  }
  
  console.log('Finished fixing lint errors');
}

fixLintErrors().catch(console.error);
