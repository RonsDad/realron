require('esbuild').build({
        entryPoints: ['extension.js'],
        bundle: true,
        outfile: 'out.js',
        platform: 'node',
    });