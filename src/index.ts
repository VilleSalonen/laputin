/// <reference path="command-line-args.d.ts" />

import commandLineArgs = require('command-line-args');
import commandLineUsage = require('command-line-usage');
import fs = require('fs');
import path = require('path');
import winston = require('winston');

import { Library } from './library';
import { LaputinConfiguration } from './laputinconfiguration';
import { compose } from './compose';
import { ProxyGenerator } from './proxygenerator';

import open = require('open');
import { IHasher } from './ihasher';

import { promisify } from 'util';
import { QuickMD5Hasher } from './quickmd5hasher';
import { XxhashHasher } from './xxhashhasher';
import { SceneDetector } from './scenedetector';
const stat = promisify(fs.stat);

(async function() {
    const sections = [
        {
            header: 'Laputin',
            content: 'Organize your local files with tags.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'library',
                    typeLabel: '{underline path}',
                    description: 'Path to your file library.'
                },
                {
                    name: 'help',
                    description: 'Print this usage guide.'
                }
            ]
        }
    ];
    const usage = commandLineUsage(sections);

    const argumentDefinitions = [
        {
            name: 'library',
            type: String,
            multiple: false,
            defaultOption: true
        },
        { name: 'help', type: Boolean, multiple: false },
        { name: 'initialize', type: Boolean, multiple: false },
        { name: 'createProxies', type: Boolean, multiple: false },
        { name: 'detectScenes', type: Boolean, multiple: false },
        { name: 'detectScenesFilename', type: String, multiple: false },
        { name: 'verbose', type: Boolean, multiple: false },
        { name: 'performFullCheck', type: Boolean, multiple: false },
        { name: 'hashFile', type: String, multiple: false },
        { name: 'hasher', type: String, multiple: false },
        {
            name: 'skipBrowserOpen',
            type: Boolean,
            multiple: false,
            defaultOption: false
        }
    ];
    const options = commandLineArgs(argumentDefinitions);

    if (options.help) {
        console.log(usage);
        process.exit(-1);
    }

    if (options.verbose) {
        winston.level = 'verbose';
    }

    if (options.hashFile) {
        let hasher: IHasher = new QuickMD5Hasher();
        if (options.hasher && options.hasher === 'accurate') {
            hasher = new XxhashHasher();
        }

        const fileStats = await stat(options.hashFile);
        const hash = await hasher.hash(options.hashFile, fileStats);
        console.log(hash);
        process.exit(0);
    }

    if (!options.library) {
        winston.error('You have to pass library path as an argument.');
        console.log(usage);
        process.exit(-1);
    }

    // For some reason " is added only to the end of the path if path contains spaces.
    options.library = options.library.replace(/\"/g, '');

    if (
        !fs.existsSync(options.library) ||
        !fs.statSync(options.library).isDirectory()
    ) {
        winston.error(`${options.library} is not a valid directory.`);
        process.exit(-2);
    }

    const dbFilePath = path.join(options.library, '.laputin.db');
    if (options.initialize) {
        if (fs.existsSync(dbFilePath)) {
            winston.error(
                `${options.library} has already been initialized as Laputin library. Refusing to re-initialize.`
            );
            process.exit(-1);
        }

        const library = new Library(options.library);
        await library.createTables();

        winston.info(
            `${options.library} has been initialized as Laputin library. You can now start Laputin without --initialize.`
        );
        process.exit(0);
    }

    if (!fs.existsSync(dbFilePath)) {
        winston.error(
            `${options.library} has not been initialized as Laputin library.`
        );
        console.log(usage);
        process.exit(-1);
    }

    const configFilePath = path.join(options.library, '.laputin.json');
    const configuration: LaputinConfiguration = fs.existsSync(configFilePath)
        ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
        : new LaputinConfiguration(3200, 'quick', null, []);

    if (options.createProxies) {
        const library = new Library(options.library);
        const proxyGenerator = new ProxyGenerator(library, configuration);
        await proxyGenerator.generateMissingProxies();

        process.exit(0);
    }

    if (options.detectScenes) {
        const library = new Library(options.library);
        const sceneDetector = new SceneDetector(options.library, library);
        try {
            await sceneDetector.detectMissingScenes(
                options.detectScenesFilename || ''
            );
            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(-1);
        }
    }

    const laputin = compose(options.library, configuration);

    laputin.initializeRoutes();
    const timer = winston.startTimer();
    await laputin.loadFiles(options.performFullCheck);
    timer.done('Hashing');

    laputin.startMonitoring();

    winston.info(`Library path: ${options.library}`);
    await laputin.startListening();
    winston.info(`Laputin started at http://localhost:${configuration.port}`);
    if (!options.skipBrowserOpen) {
        await open(`http://localhost:${configuration.port}`);
    }
})();
