import { expect } from 'chai';

import fs = require('fs');
import request = require('supertest');
import events = require('events');
import { fail } from 'assert';

import { File } from './../src/laputin/file';
import { composeForTests } from './../src/laputin/compose';
import { Laputin } from './../src/laputin/laputin';
import { LaputinConfiguration } from './../src/laputin/laputinconfiguration';
import { Library } from './../src/laputin/library';
import express = require('express');
import rimraf = require('rimraf');

describe('File Library', function () {
    // For some reason watching for file changes seems to always take about 5
    // seconds to notify about the changes. Normal timeout for mocha tests is
    // 2 seconds so we need to increase the timeout.
    this.timeout(10000);

    let laputin: Laputin;
    let currentPath: string;

    const carFileHash = '76dc0e4782275a1a878b3b6ec1abe382';
    const catFileHash = 'ea411d1af31ebb729a37c58c8e34236c';
    const landscapeFileHash = 'b998da85d8402624769e44622b883597';

    beforeEach(async function () {
        if (!this.currentTest) {
            fail('current test is undefined');
        }

        currentPath = this.currentTest.fullTitle().toLowerCase().replace(/ /g, '_');
    });

    afterEach(async () => {
        await shutdownLaputin(laputin);
    });

    describe('Detecting initial state', () => {
        it('No files can be found from empty directory', async () => {
            laputin = await initializeLaputin(currentPath);

            return shouldContainFiles(laputin, []);
        });

        it('Initial files can be found', async () => {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            const catsFile = new File(
                2,
                catFileHash,
                'deploy-tests/' + currentPath + '/cats.jpg',
                [],
                30791,
                'image/jpeg'
            );
            const landscapeFile = new File(
                3,
                landscapeFileHash,
                'deploy-tests/' + currentPath + '/jyvasjarvi.jpg',
                [],
                73221,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await copyFile('tests/test-content/cats.jpg', 'deploy-tests/' + currentPath + '/cats.jpg');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after files have been copied
            laputin = await initializeLaputin(currentPath);

            return shouldContainFiles(laputin, [carFile, catsFile, landscapeFile]);
        });
    });

    describe('New file detected', () => {
        it('Offline', async () => {
            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return shouldContainFiles(laputin, [carFile]);
        });

        it('Online', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );

            // Start monitoring before file is copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await waitForEvent(laputin.fileLibrary, carFileHash, 'found', 8000);
            await delay(100);
            return shouldContainFiles(laputin, [carFile]);
        });
    });

    describe('Ignored files are ignored', () => {
        it('Offline', async () => {
            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            await copyFile('tests/test-content/Thumbs.db', 'deploy-tests/' + currentPath + '/Thumbs.db');
            await copyFile('tests/test-content/.ignored', 'deploy-tests/' + currentPath + '/.ignored');
            await copyFile('tests/test-content/ignored.tmp', 'deploy-tests/' + currentPath + '/ignored.tmp');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return shouldContainFiles(laputin, []);
        });

        it('Online', async function () {
            // Start monitoring before file is copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/Thumbs.db', 'deploy-tests/' + currentPath + '/Thumbs.db');
            await copyFile('tests/test-content/.ignored', 'deploy-tests/' + currentPath + '/.ignored');
            await copyFile('tests/test-content/ignored.tmp', 'deploy-tests/' + currentPath + '/ignored.tmp');

            return shouldContainFiles(laputin, []);
        });
    });

    describe('File path change detected', () => {
        it('Offline', async () => {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/automobile.jpg',
                [],
                39031,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            fs.renameSync(
                'deploy-tests/' + currentPath + '/car.jpg',
                'deploy-tests/' + currentPath + '/automobile.jpg'
            );

            // Detecting changes after second startup
            await startLaputin(laputin);

            return shouldContainFiles(laputin, [carFile]);
        });

        it('Online', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/automobile.jpg',
                [],
                39031,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Start monitoring before file is copied
            laputin = await initializeLaputin(currentPath);

            fs.renameSync(
                'deploy-tests/' + currentPath + '/car.jpg',
                'deploy-tests/' + currentPath + '/automobile.jpg'
            );
            await waitForEvent(laputin.fileLibrary, carFileHash, 'found', 8000);
            await delay(100);
            return shouldContainFiles(laputin, [carFile]);
        });
    });

    describe('File deletion detected', () => {
        it('Offline', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            const landscapeFile = new File(
                2,
                landscapeFileHash,
                'deploy-tests/' + currentPath + '/jyvasjarvi.jpg',
                [],
                73221,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await copyFile('tests/test-content/cats.jpg', 'deploy-tests/' + currentPath + '/cats.jpg');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            fs.unlinkSync('deploy-tests/' + currentPath + '/cats.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return await shouldContainFiles(laputin, [carFile, landscapeFile]);
        });

        it('Online', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            const landscapeFile = new File(
                2,
                landscapeFileHash,
                'deploy-tests/' + currentPath + '/jyvasjarvi.jpg',
                [],
                73221,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await copyFile('tests/test-content/cats.jpg', 'deploy-tests/' + currentPath + '/cats.jpg');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after files have been copied
            laputin = await initializeLaputin(currentPath);

            fs.unlinkSync('deploy-tests/' + currentPath + '/cats.jpg');
            await waitForEvent(laputin.fileLibrary, catFileHash, 'lost', 8000);
            return await shouldContainFiles(laputin, [carFile, landscapeFile]);
        });
    });

    describe('Duplicate file detected', () => {
        it('Offline', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            const duplicateCarFile = new File(
                2,
                carFileHash,
                'deploy-tests/' + currentPath + '/car-duplicate.jpg',
                [],
                39031,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car-duplicate.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
                '76dc0e4782275a1a878b3b6ec1abe382': [carFile, duplicateCarFile],
            });

            // Note that Laputin returns newly copied duplicate version of car.
            // This is because newer versions of file with same hash are always
            // used to overwrite the previous path.
            return await shouldContainFiles(laputin, [duplicateCarFile]);
        });

        it('Online', async function () {
            const carFile = new File(
                1,
                carFileHash,
                'deploy-tests/' + currentPath + '/car.jpg',
                [],
                39031,
                'image/jpeg'
            );
            const duplicateCarFile = new File(
                2,
                carFileHash,
                'deploy-tests/' + currentPath + '/car-duplicate.jpg',
                [],
                39031,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Start monitoring after files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car-duplicate.jpg');
            await waitForEvent(laputin.fileLibrary, carFileHash, 'found', 8000);
            await delay(100);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
                '76dc0e4782275a1a878b3b6ec1abe382': [carFile, duplicateCarFile],
            });

            // Note that Laputin returns newly copied duplicate version of car.
            // This is because newer versions of file with same hash are always
            // used to overwrite the previous path.
            return await shouldContainFiles(laputin, [duplicateCarFile]);
        });
    });

    describe('New directory should be skipped', () => {
        it('Offline', async function () {
            fs.mkdirSync('deploy-tests/' + currentPath + '');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            await shutdownLaputin(laputin);

            fs.mkdirSync('deploy-tests/' + currentPath + '/foobar');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return await shouldContainFiles(laputin, []);
        });

        it('Online', async function () {
            fs.mkdirSync('deploy-tests/' + currentPath + '');

            laputin = await initializeLaputin(currentPath);

            fs.mkdirSync('deploy-tests/' + currentPath + '/foobar');
            await delay(1000);

            return await shouldContainFiles(laputin, []);
        });
    });

    describe('Online duplicate detection edge cases', () => {
        it('When a file is overwritten with exact same file to exact same path, it is not detected as duplicate', async function () {
            const landscapeFile = new File(
                1,
                landscapeFileHash,
                'deploy-tests/' + currentPath + '/jyvasjarvi.jpg',
                [],
                73221,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after initial files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');
            await waitForEvent(laputin.fileLibrary, landscapeFileHash, 'found', 8000);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({});

            return await shouldContainFiles(laputin, [landscapeFile]);
        });

        it('When a file is renamed, it is not detected as duplicate', async function () {
            const landscapeFile = new File(
                1,
                landscapeFileHash,
                'deploy-tests/' + currentPath + '/jyvasjarvi.jpg',
                [],
                73221,
                'image/jpeg'
            );

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after initial files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');
            await waitForEvent(laputin.fileLibrary, landscapeFileHash, 'found', 8000);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({});

            return await shouldContainFiles(laputin, [landscapeFile]);
        });
    });
});

function shouldContainFiles(l: Laputin, expectedFiles: File[]): request.Test {
    return request(l.app).get('/api/files').expect(200).expect(expectedFiles);
}

function waitForEvent(
    emitter: events.EventEmitter,
    fileHash: string,
    eventName: string,
    timeoutMs: number
): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const errTimeout = setTimeout(
            () => reject(new Error(`Event ${eventName} for file ${fileHash} was not emitted`)),
            timeoutMs
        );

        emitter.on(eventName, (eventFile: File) => {
            if (eventFile.hash === fileHash) {
                clearTimeout(errTimeout);
                resolve();
            }
        });
    });
}

async function initializeLaputin(path: string): Promise<Laputin> {
    const archivePath = './deploy-tests/' + path;

    rimraf.sync(archivePath);
    fs.mkdirSync(archivePath);

    await Library.initialize(archivePath);

    const fakeScreenshotter: any = {
        exists: () => {
            console.log('exists');
        },
        screenshot: () => {
            console.log('screenshot');
        },
        screenshotTimecode: () => {
            console.log('screenshotTimecode');
        },
    };
    const l = composeForTests(
        archivePath,
        new LaputinConfiguration([archivePath], 1234, 'accurate'),
        fakeScreenshotter
    );

    await startLaputin(l);

    return l;
}

async function startLaputin(l: Laputin): Promise<void> {
    const app = express();
    l.initializeRoutes(app);
    l.startListening(1234);

    // File monitoring seems to need some time to wake up
    await delay(100);
}

async function shutdownLaputin(l: Laputin): Promise<void> {
    if (l) {
        l.fileLibrary.close();
        l.stopListening();

        await delay(100);
    } else {
        console.log('failed shutdown');
    }
}

function copyFile(source: string, target: string): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        const rd = fs.createReadStream(source);
        rd.on('error', reject);
        const wr = fs.createWriteStream(target);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    });
}

function delay(milliseconds: number): Promise<any> {
    return new Promise((resolve) => {
        setTimeout(() => resolve({}), milliseconds);
    });
}
