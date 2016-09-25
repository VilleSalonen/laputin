import chai = require('chai');
const expect = chai.expect;
import fs = require('fs');
import rimraf = require('rimraf');
import request = require('supertest');

import { File } from './../file';
import { Tag } from './../tag';
import { composeForTests } from './../compose';
import { Laputin } from './../laputin';
import { LaputinConfiguration } from './../laputinconfiguration';

describe('Laputin API', function () {
    let currentPath: string;
    let laputin: Laputin;

    beforeEach(async function () {
        currentPath = this.currentTest.title.toLowerCase().replace(/ /g, '_');
        laputin = await initializeLaputin(currentPath);
    });

    afterEach(async function () {
        await laputin.stopListening();
    });

    it('Added file can be found', async () => {
        const file: File = new File('aaaaa11111', 'new_funny_pic.jpg', [], 123);

        await laputin.library.addFile(file);

        return shouldContainFiles(laputin, [file]);
    });

    it('Added tag can be found from unassociated tags', async () => {
        const tag = await laputin.library.createNewTag('Educational');

        return request(laputin.app)
            .get('/api/tags?unassociated=true')
            .expect(200)
            .expect([tag]);
    });

    it('Tag can be renamed', async () => {
        const tag = await laputin.library.createNewTag('Educational');
        const expectedTag = new Tag(tag.id, 'Very educational', 0);

        await request(laputin.app)
            .put('/api/tags/' + tag.id)
            .send({ name: 'Very educational' })
            .expect(200)
            .expect(expectedTag);

        return request(laputin.app)
            .get('/api/tags?unassociated=true')
            .expect(200)
            .expect([expectedTag]);
    });

    it('Added tag can _not_ be found from associated tags', async () => {
        const tag = await laputin.library.createNewTag('Hilarious');

        return request(laputin.app)
            .get('/api/tags')
            .expect(200)
            .expect([]);
    });

    it('Creating duplicate tag returns error', async () => {
        const tag = await laputin.library.createNewTag('Seeing double');

        return request(laputin.app)
            .post('/api/tags')
            .send({ tagName: tag.name })
            .expect(500);
    });

    it('Creating tag with empty name returns error', () => {
        return request(laputin.app)
            .post('/api/tags')
            .send({ tagName: '' })
            .expect(500);
    });

    describe('Tagging', () => {
        const file: File = new File('aaaaa', 'funny.jpg', [], 123);
        let tag: Tag;

        beforeEach(async () => {
            tag = await laputin.library.createNewTag('Funny');
            await laputin.library.addFile(file);
        });

        it('File can be tagged', async () => {
            await request(laputin.app)
                .post('/api/files/' + file.hash + '/tags')
                .send({ selectedTags: [tag] })
                .expect(200);

            await shouldContainFiles(laputin, [new File(file.hash, file.path, [tag], 123)]);
        });

        it('File tagging can be removed', async () => {
            await request(laputin.app)
                .post('/api/files/' + file.hash + '/tags')
                .send({ selectedTags: [tag] })
                .expect(200);

            await request(laputin.app)
                .delete('/api/files/' + file.hash + '/tags/' + tag.id)
                .send({ tagId: tag.id })
                .expect(200);

            await shouldContainFiles(laputin, [new File(file.hash, file.path, [], 123)]);
        });
    });

    describe('Querying files by tagged status', async () => {
        const taggedFile: File = new File('aaaaa', 'funny.jpg', [], 123);
        const untaggedFile: File = new File('bbbbb', 'untagged.jpg', [], 123);

        let tag: Tag;

        beforeEach(async () => {
            await laputin.library.addFile(taggedFile);
            await laputin.library.addFile(untaggedFile);

            tag = await laputin.library.createNewTag('Funnyyyy');
            await request(laputin.app)
                .post('/api/files/' + taggedFile.hash + '/tags')
                .send({ selectedTags: [tag] })
                .expect(200);
        });

        it('Querying both tagged and untagged files', async () => {
            return request(laputin.app)
                .get('/api/files?status=both')
                .expect(200)
                .expect([
                    new File(taggedFile.hash, taggedFile.path, [tag], 123),
                    untaggedFile]);
        });

        it('Querying only tagged', async () => {
            return request(laputin.app)
                .get('/api/files?status=tagged')
                .expect(200)
                .expect([new File(taggedFile.hash, taggedFile.path, [tag], 123)]);
        });

        it('Querying only untagged', async () => {
            return request(laputin.app)
                .get('/api/files?status=untagged')
                .expect(200)
                .expect([untaggedFile]);
        });
    });

    describe('Querying files by tags', () => {
        beforeEach(async () => {
            const file1: File = new File('aaaaa', 'funny.jpg', [], 123);
            const file2: File = new File('bbbbb', 'educational.jpg', [], 123);
            const file3: File = new File('ccccc', 'serious.jpg', [], 123);

            await laputin.library.addFile(file1);
            await laputin.library.addFile(file2);
            await laputin.library.addFile(file3);

            const tag1 = await laputin.library.createNewTag('1');
            const tag2 = await laputin.library.createNewTag('2');
            const tag3 = await laputin.library.createNewTag('3');
            const tag4 = await laputin.library.createNewTag('4');
            const tag5 = await laputin.library.createNewTag('5');
            const tag6 = await laputin.library.createNewTag('6');
            const tag7 = await laputin.library.createNewTag('7');

            await laputin.library.createNewLinkBetweenTagAndFile(tag1, file1.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag2, file1.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag3, file1.hash);

            await laputin.library.createNewLinkBetweenTagAndFile(tag2, file2.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag3, file2.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag4, file2.hash);

            await laputin.library.createNewLinkBetweenTagAndFile(tag5, file3.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag6, file3.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag7, file3.hash);
        });

        it('A single AND tag', async () => {
            return request(laputin.app)
                .get('/api/files?and=1')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa']);
                });
        });

        it('Multiple AND tags', async () => {
            return request(laputin.app)
                .get('/api/files?and=2,3')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa', 'bbbbb']);
                });
        });

        it('A single OR tag', async () => {
            return request(laputin.app)
                .get('/api/files?or=1')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa']);
                });
        });

        it('Multiple OR tags', async () => {
            return request(laputin.app)
                .get('/api/files?or=1,7')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa', 'ccccc']);
                });
        });

        it('A single NOT tag', async () => {
            return request(laputin.app)
                .get('/api/files?not=2')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['ccccc']);
                });
        });

        it('Multiple NOT tags', async () => {
            return request(laputin.app)
                .get('/api/files?not=1,6')
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['bbbbb']);
                });
        });
    });

    describe('Deactivation', () => {
        const file1: File = new File('aaaaa', 'funny.jpg', [], 123);
        const file2: File = new File('bbbbb', 'educational.jpg', [], 123);
        const file3: File = new File('ccccc', 'serious.jpg', [], 123);

        beforeEach(async () => {
            await laputin.library.addFile(file1);
            await laputin.library.addFile(file2);
            await laputin.library.addFile(file3);
        });

        it('A single file can be deactivated', async () => {
            laputin.library.deactivateFile(file1);
            return shouldContainFiles(laputin, [file2, file3]);
        });

        it('All files can be deactivated', async () => {
            laputin.library.deactivateAll();
            return shouldContainFiles(laputin, []);
        });
    });

    async function initializeLaputin(path: string): Promise<Laputin> {
        const archivePath = 'deploy-tests/' + path;

        rimraf.sync(archivePath);
        fs.mkdirSync(archivePath);

        const fakeScreenshotter: any = {exists: () => {}, screenshot: () => {}, screenshotTimecode: () => {}};
        const l = composeForTests(archivePath, new LaputinConfiguration(1234, 'accurate', null, []), fakeScreenshotter);
        l.initializeRoutes();

        await l.library.createTables();

        await l.startListening();

        return l;
    }

    function shouldContainFiles(l: Laputin, expectedFiles: File[]): request.Test {
        return request(l.app)
            .get('/api/files')
            .expect(200)
            .expect(expectedFiles);
    }

    function resultShouldContainFileHashes(res: { body: any[] }, expectedHashes: string[]) {
        const hashes = res.body.map(f => f.hash).sort();
        expect(hashes).to.eql(expectedHashes);
    }
});
