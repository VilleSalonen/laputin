import { assert, expect, should } from 'chai';
import * as chai from 'chai';
import chaiExclude from 'chai-exclude';
import fs = require('fs');
import rimraf = require('rimraf');
import request = require('supertest');

import { File } from './../src/laputin/file';
import { Tag } from './../src/laputin/tag';
import { composeForTests } from './../src/laputin/compose';
import { Laputin } from './../src/laputin/laputin';
import { LaputinConfiguration } from './../src/laputin/laputinconfiguration';
import { Library } from './../src/laputin/library';
import { fail } from 'assert';
import express = require('express');
import { PrismaClient } from '@prisma/client';

chai.use(chaiExclude);

const prisma: PrismaClient = new PrismaClient();

describe('Laputin API', function () {
    let currentPath: string;
    let laputin: Laputin;

    beforeEach(async function () {
        if (!this.currentTest) {
            fail('current test is undefined');
        }

        await prisma.tagsOnFiles.deleteMany();
        await prisma.file.deleteMany();
        await prisma.tag.deleteMany();

        currentPath = this.currentTest.title.toLowerCase().replace(/ /g, '_');
        laputin = await initializeLaputin(currentPath);
    });

    afterEach(async function () {
        laputin.stopListening();
    });

    it('Added file can be found', async () => {
        // Arrange
        const file = new File(NaN, 'aaaaa11111', 'new_funny_pic.jpg', [], 123, 'image/jpeg', {});

        // Act
        const createdFile = await laputin.library.addFile(file);

        // Assert
        should().exist(createdFile);
        assert.deepEqualExcluding({ a: 'a', b: 'b' }, { b: 'b' }, 'a');
        assert.deepEqualExcluding(<File>createdFile, file, 'fileId');

        return shouldContainFiles(laputin, [<File>createdFile]);
    });

    it('Added tag can be found from unassociated tags', async () => {
        const tag = await laputin.library.createNewTag('Educational');

        return request(laputin.app).get('/api/tags?unassociated=true').expect(200).expect([tag]);
    });

    it('Tag can be renamed', async () => {
        const tag = await laputin.library.createNewTag('Educational');
        const expectedTag = new Tag(tag.id, 'Very educational', 0);

        await request(laputin.app)
            .put('/api/tags/' + tag.id)
            .send({ name: 'Very educational' })
            .expect(200)
            .expect(expectedTag);

        return request(laputin.app).get('/api/tags?unassociated=true').expect(200).expect([expectedTag]);
    });

    it('Added tag can _not_ be found from associated tags', async () => {
        await laputin.library.createNewTag('Hilarious');

        return request(laputin.app).get('/api/tags').expect(200).expect([]);
    });

    it('Creating duplicate tag returns error', async () => {
        const tag = await laputin.library.createNewTag('Seeing double');

        return request(laputin.app).post('/api/tags').send({ tagName: tag.name }).expect(500);
    });

    it('Creating tag with empty name returns error', () => {
        return request(laputin.app).post('/api/tags').send({ tagName: '' }).expect(500);
    });

    describe('Tagging', () => {
        const file: File = new File(1, 'aaaaa', 'funny.jpg', [], 123, 'image/jpeg', {});
        let createdFile: File;
        let tag: Tag;

        beforeEach(async () => {
            tag = await laputin.library.createNewTag('Funny');
            const temp = await laputin.library.addFile(file);

            if (!temp) {
                fail('File was not created');
            }

            createdFile = temp;
        });

        it('File can be tagged', async () => {
            await laputin.library.createNewLinkBetweenTagAndFile(tag, file.hash);
            // TODO: why doesn't tag POST reach server?
            /*await request(laputin.app)
                .post(`/api/files/${createdFile.fileId}/tags`)
                .send({ selectedTags: [tag] })
                .expect(200);*/

            const expectedFile = new File(
                createdFile.fileId,
                createdFile.hash,
                createdFile.path,
                [tag],
                createdFile.size,
                createdFile.type,
                createdFile.metadata
            );
            await shouldContainFiles(laputin, [expectedFile]);
        });

        it('File can be tagged twice with same tag without error', async () => {
            await laputin.library.createNewLinkBetweenTagAndFile(tag, file.hash);
            await laputin.library.createNewLinkBetweenTagAndFile(tag, file.hash);
            // TODO: why doesn't tag POST reach server?
            /*await request(laputin.app)
                .post(`/api/files/${createdFile.fileId}/tags`)
                .send({ selectedTags: [tag] })
                .expect(200);*/

            const expectedFile = new File(
                createdFile.fileId,
                createdFile.hash,
                createdFile.path,
                [tag],
                createdFile.size,
                createdFile.type,
                createdFile.metadata
            );
            await shouldContainFiles(laputin, [expectedFile]);
        });

        it('File tagging can be removed', async () => {
            await laputin.library.createNewLinkBetweenTagAndFile(tag, file.hash);
            await laputin.library.deleteLinkBetweenTagAndFile(tag.id, file.hash);

            // TODO: why doesn't tag POST reach server?
            /*await request(laputin.app)
                .delete(`/api/files/${file.fileId}/tags/${tag.id}`)
                .send({ tagId: tag.id })
                .expect(200);*/

            await shouldContainFiles(laputin, [
                new File(
                    createdFile.fileId,
                    createdFile.hash,
                    createdFile.path,
                    [],
                    createdFile.size,
                    createdFile.type,
                    createdFile.metadata
                ),
            ]);
        });
    });

    describe('Querying files by tagged status', async () => {
        let taggedFile: File;
        let untaggedFile: File;

        let tag: Tag;

        beforeEach(async () => {
            const temp1 = await laputin.library.addFile(new File(NaN, 'aaaaa', 'funny.jpg', [], 123, 'image/jpeg', {}));
            if (!temp1) {
                fail('File was not created');
            }
            taggedFile = temp1;

            const temp2 = await laputin.library.addFile(
                new File(NaN, 'bbbbb', 'untagged.jpg', [], 123, 'image/jpeg', {})
            );
            if (!temp2) {
                fail('File was not created');
            }
            untaggedFile = temp2;

            tag = await laputin.library.createNewTag('Funnyyyy');

            // TODO: why doesn't this work?
            /*await request(laputin.app)
                .post('/api/files/' + taggedFile.hash + '/tags')
                .send({ selectedTags: [tag] })
                .expect(200);*/
            await laputin.library.createNewLinkBetweenTagAndFile(tag, taggedFile.hash);
        });

        it('Querying both tagged and untagged files', async () => {
            return request(laputin.app)
                .get('/api/files?status=both')
                .expect(200)
                .expect([
                    new File(
                        taggedFile.fileId,
                        taggedFile.hash,
                        taggedFile.path,
                        [tag],
                        taggedFile.size,
                        taggedFile.type,
                        taggedFile.metadata
                    ),
                    untaggedFile,
                ]);
        });

        it('Querying only tagged', async () => {
            return request(laputin.app)
                .get('/api/files?status=tagged')
                .expect(200)
                .expect([
                    new File(
                        taggedFile.fileId,
                        taggedFile.hash,
                        taggedFile.path,
                        [tag],
                        taggedFile.size,
                        taggedFile.type,
                        taggedFile.metadata
                    ),
                ]);
        });

        it('Querying only untagged', async () => {
            return request(laputin.app).get('/api/files?status=untagged').expect(200).expect([untaggedFile]);
        });
    });

    describe('Querying files by tags', () => {
        let file1: File;
        let file2: File;
        let file3: File;

        let tag1: Tag;
        let tag2: Tag;
        let tag3: Tag;
        let tag4: Tag;
        let tag5: Tag;
        let tag6: Tag;
        let tag7: Tag;

        beforeEach(async () => {
            file1 = await laputin.library.addFile(new File(NaN, 'aaaaa', 'funny.jpg', [], 123, 'image/jpeg'));
            file2 = await laputin.library.addFile(new File(NaN, 'bbbbb', 'educational.jpg', [], 123, 'image/jpeg'));
            file3 = await laputin.library.addFile(new File(NaN, 'ccccc', 'serious.jpg', [], 123, 'image/jpeg'));

            tag1 = await laputin.library.createNewTag('1');
            tag2 = await laputin.library.createNewTag('2');
            tag3 = await laputin.library.createNewTag('3');
            tag4 = await laputin.library.createNewTag('4');
            tag5 = await laputin.library.createNewTag('5');
            tag6 = await laputin.library.createNewTag('6');
            tag7 = await laputin.library.createNewTag('7');

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
                .get(`/api/files?and=${tag1.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa']);
                });
        });

        it('Multiple AND tags', async () => {
            return request(laputin.app)
                .get(`/api/files?and=${tag2.id},${tag3.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa', 'bbbbb']);
                });
        });

        it('A single OR tag', async () => {
            return request(laputin.app)
                .get(`/api/files?or=${tag1.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa']);
                });
        });

        it('Multiple OR tags', async () => {
            return request(laputin.app)
                .get(`/api/files?or=${tag1.id},${tag7.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['aaaaa', 'ccccc']);
                });
        });

        it('A single NOT tag', async () => {
            return request(laputin.app)
                .get(`/api/files?not=${tag2.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['ccccc']);
                });
        });

        it('Multiple NOT tags', async () => {
            return request(laputin.app)
                .get(`/api/files?not=${tag1.id},${tag6.id}`)
                .expect((res: any) => {
                    resultShouldContainFileHashes(res, ['bbbbb']);
                });
        });
    });

    describe('Deactivation', () => {
        let file1: File;
        let file2: File;
        let file3: File;

        beforeEach(async () => {
            file1 = await laputin.library.addFile(new File(NaN, 'aaaaa', 'funny.jpg', [], 123, 'image/jpeg'));
            file2 = await laputin.library.addFile(new File(NaN, 'bbbbb', 'educational.jpg', [], 123, 'image/jpeg'));
            file3 = await laputin.library.addFile(new File(NaN, 'ccccc', 'serious.jpg', [], 123, 'image/jpeg'));
        });

        it('A single file can be deactivated', async () => {
            laputin.library.deactivateFile(file1);
            return shouldContainFiles(laputin, [file2, file3]);
        });

        // TODO:
        // it('All files can be deactivated', async () => {
        //     laputin.library.deactivateAll();
        //     return shouldContainFiles(laputin, []);
        // });
    });

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

        const app = express();
        l.initializeRoutes(app);
        l.startListening(1234);

        return l;
    }

    function shouldContainFiles(l: Laputin, expectedFiles: File[]): request.Test {
        return request(l.app).get('/api/files').expect(200).expect(expectedFiles);
    }

    function resultShouldContainFileHashes(res: { body: any[] }, expectedHashes: string[]) {
        const hashes = res.body.map((f) => f.hash).sort();
        expect(hashes).to.eql(expectedHashes);
    }
});
