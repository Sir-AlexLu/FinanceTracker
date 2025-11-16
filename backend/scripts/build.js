import esbuild from 'esbuild';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const build = async () => {
  console.log('🔨 Building backend for production...');

  try {
    // Clean dist folder
    const distPath = path.join(__dirname, '..', 'dist');
    
    try {
      await fs.rm(distPath, { recursive: true, force: true });
    } catch (error) {
      // Directory might not exist
    }
    
    await fs.mkdir(distPath, { recursive: true });

    // Copy package.json
    const packageJson = await fs.readFile(
      path.join(__dirname, '..', 'package.json'),
      'utf-8'
    );
    await fs.writeFile(
      path.join(distPath, 'package.json'),
      packageJson
    );

    // Copy .env if exists (for local testing)
    try {
      await fs.copyFile(
        path.join(__dirname, '..', '.env'),
        path.join(distPath, '.env')
      );
    } catch (error) {
      // .env might not exist in production
      console.log('⚠️  .env file not found, skipping...');
    }

    // Build with esbuild
    await esbuild.build({
      entryPoints: [path.join(__dirname, '..', 'server.js')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: path.join(distPath, 'server.js'),
      external: [
        'mongoose',
        'fastify',
        '@fastify/*',
        'bcrypt',
        'dotenv',
        'zod'
      ],
      minify: process.env.NODE_ENV === 'production',
      sourcemap: process.env.NODE_ENV !== 'production',
      treeShaking: true,
      banner: {
        js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);`
      }
    });

    console.log('✅ Build completed successfully!');
    console.log(`📁 Output directory: ${distPath}`);
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
};

// Run build if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export { build };
