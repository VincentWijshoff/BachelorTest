const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'development',
    entry: './dist_browser/browser/browser_main.js',
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'public'),
    },
    resolve: {
        fallback: {
            'buffer': require.resolve('buffer/'),
            'stream': require.resolve('stream-browserify'),
            'crypto': false,
            'fs': false,
            'enquirer': false,
            'object-hash': false
        }
    },
    target: 'web',
    plugins: [
    // fix "process is not defined" error:
    // (do "npm install process" before running the build)
        new webpack.ProvidePlugin({
            process: 'process/browser',
        }),
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
        }),
    ],
    externals: {
        bufferutil: 'bufferutil',
        'utf-8-validate': 'utf-8-validate'
    }
};