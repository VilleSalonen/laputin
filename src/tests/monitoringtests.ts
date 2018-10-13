import chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

import fs = require('fs');
import rimraf = require('rimraf');
import request = require('supertest');
import events = require('events');

import {File} from './../file';
import {Tag} from './../tag';
import {compose} from './../compose';
import {Laputin} from './../laputin';
import {LaputinConfiguration} from './../laputinconfiguration';

describe('File Library', function() {
    // For some reason watching for file changes seems to always take about 5
    // seconds to notify about the changes. Normal timeout for mocha tests is
    // 2 seconds so we need to increase the timeout.
    this.timeout(10000);

    let laputin: Laputin;
    let currentPath: string;

    const carFileHash =
        '32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592';
    const catFileHash =
        '70342c64bed51a0921b68e2df2fe893bc52c89454ee2dcb47aff436b7259d71805dbaf36838db76a7e919ba6249273d261b0f892b8b4958748350ff1f25d572e';
    const landscapeFileHash =
        '44f332dadcd09cc73c14b30a8334c1bf7d615829dd111f47fa9d3ae212933e32cbf59cd700010bd0e950309d64c23b03badcb990170676e003a0b02b63d3e757';

    beforeEach(async function() {
        currentPath = this.currentTest.fullTitle().toLowerCase().replace(/ /g, '_');
    });

    afterEach(async () => {
        shutdownLaputin(laputin);
    });

    describe('Detecting initial state', () => {
        it('No files can be found from empty directory', async () => {
            laputin = await initializeLaputin(currentPath);

            return shouldContainFiles(laputin, []);
        });

        it('Initial files can be found', async () => {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            const catsFile = new File(catFileHash, 'deploy-tests/' + currentPath + '/cats.jpg', [], 30791);
            const landscapeFile = new File(landscapeFileHash, 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg', [], 73221);

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
            shutdownLaputin(laputin);

            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return shouldContainFiles(laputin, [carFile]);
        });

        it('Online', async function() {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);

            // Start monitoring before file is copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await waitForEvent(laputin.fileLibrary, 'found', 8000);
            return shouldContainFiles(laputin, [carFile]);
        });
    });

    describe('File path change detected', () => {
        it('Offline', async () => {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/automobile.jpg', [], 39031);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            shutdownLaputin(laputin);

            fs.renameSync('deploy-tests/' + currentPath + '/car.jpg', 'deploy-tests/' + currentPath + '/automobile.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return shouldContainFiles(laputin, [carFile]);
        });

        it('Online', async function() {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/automobile.jpg', [], 39031);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Start monitoring before file is copied
            laputin = await initializeLaputin(currentPath);

            fs.renameSync('deploy-tests/' + currentPath + '/car.jpg', 'deploy-tests/' + currentPath + '/automobile.jpg');
            await waitForEvent(laputin.fileLibrary, 'found', 8000);
            return shouldContainFiles(laputin, [carFile]);
        });
    });

    describe('File deletion detected', () => {
        it('Offline', async function () {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            const catsFile = new File(catFileHash, 'deploy-tests/' + currentPath + '/cats.jpg', [], 30791);
            const landscapeFile = new File(landscapeFileHash, 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg', [], 73221);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await copyFile('tests/test-content/cats.jpg', 'deploy-tests/' + currentPath + '/cats.jpg');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            shutdownLaputin(laputin);

            fs.unlinkSync('deploy-tests/' + currentPath + '/cats.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return await shouldContainFiles(laputin, [carFile, landscapeFile]);
        });

        it('Online', async function () {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            const catsFile = new File(catFileHash, 'deploy-tests/' + currentPath + '/cats.jpg', [], 30791);
            const landscapeFile = new File(landscapeFileHash, 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg', [], 73221);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');
            await copyFile('tests/test-content/cats.jpg', 'deploy-tests/' + currentPath + '/cats.jpg');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after files have been copied
            laputin = await initializeLaputin(currentPath);

            fs.unlinkSync('deploy-tests/' + currentPath + '/cats.jpg');
            await waitForEvent(laputin.fileLibrary, 'lost', 8000);
            return await shouldContainFiles(laputin, [carFile, landscapeFile]);
        });
    });

    describe('Duplicate file detected', () => {
        it('Offline', async function () {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            const duplicateCarFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car-duplicate.jpg', [], 39031);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            shutdownLaputin(laputin);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car-duplicate.jpg');

            // Detecting changes after second startup
            await startLaputin(laputin);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
            '32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592':
                [carFile, duplicateCarFile]
            });

            // Note that Laputin returns newly copied duplicate version of car.
            // This is because newer versions of file with same hash are always
            // used to overwrite the previous path.
            return await shouldContainFiles(laputin, [duplicateCarFile]);
        });

        it('Online', async function () {
            const carFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car.jpg', [], 39031);
            const duplicateCarFile = new File(carFileHash, 'deploy-tests/' + currentPath + '/car-duplicate.jpg', [], 39031);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car.jpg');

            // Start monitoring after files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/car.jpg', 'deploy-tests/' + currentPath + '/car-duplicate.jpg');
            await waitForEvent(laputin.fileLibrary, 'found', 8000);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({
            '32f38f740bdeb0ca8fae735b9b149152181d6591303b80fb81cc6f189f3070d4f6b153c136ca8111c9e25c31f670e29983aef866c9055595d6e47764457b2592':
                [carFile, duplicateCarFile]
            });

            // Note that Laputin returns newly copied duplicate version of car.
            // This is because newer versions of file with same hash are always
            // used to overwrite the previous path.
            return await shouldContainFiles(laputin, [duplicateCarFile]);
        });
    });

    describe('New directory should be skipped', () => {
        it('Offline', async function() {
            fs.mkdirSync('deploy-tests/' + currentPath + '');

            // Initial startup and shutdown
            laputin = await initializeLaputin(currentPath);
            shutdownLaputin(laputin);

            fs.mkdirSync('deploy-tests/' + currentPath + '/foobar');

            // Detecting changes after second startup
            await startLaputin(laputin);

            return await shouldContainFiles(laputin, []);
        });

        it('Online', async function() {
            fs.mkdirSync('deploy-tests/' + currentPath + '');

            laputin = await initializeLaputin(currentPath);

            fs.mkdirSync('deploy-tests/' + currentPath + '/foobar');
            await delay(1000);

            return await shouldContainFiles(laputin, []);
        });
    });

    describe('Online duplicate detection edge cases', () => {
        it('When a file is overwritten with exact same file to exact same path, it is not detected as duplicate', async function() {
            const landscapeFile = new File(landscapeFileHash, 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg', [], 73221);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after initial files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');
            await waitForEvent(laputin.fileLibrary, 'found', 8000);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({});

            return await shouldContainFiles(laputin, [landscapeFile]);
        });

        it('When a file is renamed, it is not detected as duplicate', async function() {
            const landscapeFile = new File(landscapeFileHash, 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg', [], 73221);

            fs.mkdirSync('deploy-tests/' + currentPath + '');
            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');

            // Start monitoring after initial files have been copied
            laputin = await initializeLaputin(currentPath);

            await copyFile('tests/test-content/jyvasjarvi.jpg', 'deploy-tests/' + currentPath + '/jyvasjarvi.jpg');
            await waitForEvent(laputin.fileLibrary, 'found', 8000);

            const duplicates = laputin.fileLibrary.getDuplicates();
            expect(duplicates).to.eql({});

            return await shouldContainFiles(laputin, [landscapeFile]);
        });
    });
});

function shouldContainFiles(l: Laputin, expectedFiles: File[]): request.Test {
    return request(l.app)
        .get('/api/files')
        .expect(200)
        .expect(expectedFiles);
}

function shouldContainDuplicates(l: Laputin, expectedFiles: any): request.Test {
    return request(l.app)
        .get('/api/duplicates')
        .expect(200)
        .expect(expectedFiles);
}

function waitForEvent(emitter: events.EventEmitter, eventName: string, timeoutMs: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const errTimeout = setTimeout(
            () => reject(new Error('Event ' + eventName + ' was not emitted')),
            timeoutMs);

        emitter.on(eventName, () => {
            clearTimeout(errTimeout);
            resolve();
        });
    });
}

async function initializeLaputin(path: string): Promise<Laputin> {
    const archivePath = 'deploy-tests/' + path;

    if (!fs.existsSync(archivePath)) {
        fs.mkdirSync(archivePath);
    }

    const fakeScreenshotter: any = {exists: () => {}, screenshot: () => {}, screenshotTimecode: () => {}};
    const l = compose(archivePath, new LaputinConfiguration(1234, 'accurate'), fakeScreenshotter);

    await l.library.createTables();

    await startLaputin(l);

    return l;
}

async function startLaputin(l: Laputin): Promise<void> {
    l.initializeRoutes();
    await l.loadFiles(false);
    await l.startListening();

    // File monitoring seems to need some time to wake up
    await delay(100);
}

async function shutdownLaputin(l: Laputin): Promise<void> {
    if (l) {
        l.fileLibrary.close();
        await l.stopListening();

        await delay(100);
    } else {
        console.log('failed shutdown');
    }
}

function copyFile(source: string, target: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        const rd = fs.createReadStream(source);
        rd.on('error', reject);
        const wr = fs.createWriteStream(target);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    });
}

function moveFile(source: string, target: string): Promise<void> {
    return new Promise<void>(function(resolve, reject) {
        fs.rename(source, target, () => resolve());
    });
}

function delay(milliseconds: number): Promise<any> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), milliseconds);
    });
}
