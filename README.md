# Webpack Runtime Compiler

Webpack runtime compiler with support for strings and Buffer objects as virtual files in memory. This allows the application to create a string on the fly—or data like dynamic generated images—and require it within a Webpack bundle. In production envionment, the files are compiled during the first call and then cached on disk or in memory. In non-production environments, the files are stored in memory.

## Install

```bash
$ npm install webpack-runtime-compiler
```

## Use

### Compile a Webpack bundle with entry file data retrieved from a string

```js
const WebpackRuntimeCompiler = require('webpack-runtime-compiler');

let webpackOptions = {
    entry: '/path/to/entry.jsx',
    output: {
        path: '/path/to/output',
        filename: 'bundle.js',
    },
    module: {
        //...
    },
};

let customFiles = {
    '/path/to/entry.jsx': 'import react from "react"; //...',
};

let compiler = new WebpackRuntimeCompiler(webpackOptions, customFiles);

compiler.run().then(stats => {
    let fs = stats.outputFileSystem; // Use this instead of require('fs')
    fs.readFile('/path/to/output/bundle.js', (error, data) => {
        console.log(data); // Returns data from compiled Webpack bundle...
    });
});
```

### Force in memory file system in production environment

```js
const WebpackRuntimeCompiler = require('webpack-runtime-compiler');

//...

let compiler = new WebpackRuntimeCompiler(webpackOptions, customFiles, true); // Set forceInMemoryOutput to true
```

## License

[The MIT License](./LICENSE)
