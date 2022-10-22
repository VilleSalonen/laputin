import { expect, test } from '@oclif/test';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('initialize', () => {
    describe('empty directory', () => {
        const directoryPath = path.join(__dirname, 'test-runs', randomUUID());

        beforeEach(async () => {
            await fs.mkdir(directoryPath, { recursive: true });
        });

        test.stdout()
            .command(['initialize', '--library', directoryPath])
            .it('initializes an empty directory', (ctx) => {
                expect(ctx.stdout).to.contain(
                    `${directoryPath} has been initialized as Laputin library. You can now start Laputin without --initialize.`
                );
            });
    });

    describe('existing Laputin directory', () => {
        const directoryPath = path.join(__dirname, 'test-runs', randomUUID());

        beforeEach(async () => {
            await fs.mkdir(directoryPath, { recursive: true });
        });

        test.stdout()
            .command(['initialize', '--library', directoryPath])
            .command(['initialize', '--library', directoryPath])
            .catch((ctx) => {
                expect(ctx.message).to.contain(
                    `${directoryPath} has already been initialized as Laputin library. Refusing to re-initialize.`
                );
            })
            .it('refuses to initialize');
    });
});
