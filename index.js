const DynamicFs = require('dynamic-fs');
const fs = require('fs');
const MemoryFs = require('memory-fs');
const webpack = require('webpack');

module.exports = class WebpackRuntimeCompiler {

    /**
     * Webpack Runtime Compiler
     *
     * @constructor
     * @param {Object} webpackOptions - Options object used by Webpack.
     * @param {Object} customFiles - Strings to be compiled as files, i.e. { '/path/to/file.jsx': 'include ...' }.
     * @param {Object} forceInMemoryOutput - By default, storing Webpack output in memory is disabled in production.
     */
    constructor(webpackOptions, customFiles, forceInMemoryOutput) {
        this.webpackOptions = webpackOptions;
        this.customFiles = customFiles;
        this.forceInMemoryOutput = forceInMemoryOutput;
    }

    /**
     * Enqueue a compilation request, return a cache stats (production)
     * or start a new compilation and create a queue.
     */
    getPromise() {
        if (this.queue) {
            return new Promise((resolve, reject) => {
                this.queue.push({ resolve, reject });
            });
        } else if (this.webpackStats) {
            return Promise.resolve(this.webpackStats);
        }

        this.queue = [];
    }

    /**
     * Create or return a cached Webpack instance.
     */
    getWebpack() {
        if (this.webpack) {
            return this.webpack;
        }

        this.webpack = webpack(this.webpackOptions);

        if (this.customFiles) {
            this.dynamicFs = new DynamicFs(this.customFiles);
            this.webpack.inputFileSystem = this.dynamicFs;
            this.webpack.resolvers.normal.fileSystem = this.dynamicFs;
        }

        if (this.forceInMemoryOutput || 'production' !== process.env.NODE_ENV) {
            this.memoryFs = new MemoryFs();
            this.webpack.outputFileSystem = this.memoryFs;
        }

        return this.webpack;
    }

    /**
     * Resolve or reject a queued promise.
     *
     * @param {string} resolveOrReject - 'resolve' or 'reject'.
     * @param {Object} data - a stats object to resolve or an error to reject.
     */
    resolveOrRejectQueue(resolveOrReject, data) {
        this.queue.forEach(promise => {
            promise[resolveOrReject](data);
        });
        this.queue = null;
    }

    /**
     * Start a Webpack compilation. In production environment, the compiled files are cached.
     *
     * @returns {Object} The stats object returned from Webpack, with output file system set to stats.outputFileSystem.
     */
    run() {
        let promise = this.getPromise();

        if (promise) {
            return promise;
        }

        return new Promise((resolve, reject) => this.getWebpack().run((error, stats) => {
            if (error || stats.compilation.errors.length) {
                reject(error || stats.compilation.errors);
                return;
            }

            stats.outputFileSystem = stats.compilation.compiler.outputFileSystem;
            if ('production' === process.env.NODE_ENV) {
                this.webpackStats = stats;
            }

            this.resolveOrRejectQueue('resolve', stats);
            resolve(stats);
        })).catch(error => {
            this.resolveOrRejectQueue('reject', error);
            throw error;
        });
    }

}
