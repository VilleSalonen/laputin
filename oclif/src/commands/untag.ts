import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import os = require('os');
import path = require('path');
import winston = require('winston');

import { readPipe } from '../laputin/read-pipe';
import { initializeWinston } from '../laputin/winston';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { Query } from '../laputin/query.model';

export default class Untag extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        file: Flags.string({ multiple: true, exclusive: ['stdinFile'] }),
        stdinFile: Flags.boolean({ exclusive: ['file'] }),
        tag: Flags.string({ multiple: true, exclusive: ['tags'] }),
        tags: Flags.string({ exclusive: ['tag'] }),
        tagsFileName: Flags.string(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    private stdin: string | undefined;

    async init(): Promise<void> {
        // stdin must be read in init
        if (!process.stdin.isTTY) {
            this.stdin = await readPipe();
        }
    }

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(Untag);

        initializeWinston(flags.verbose);

        let files = [];
        if (flags.stdinFile) {
            const stdin = this.stdin;
            if (!stdin) {
                throw new Error('No files provided via stdin');
            }

            files = stdin.split(os.EOL).filter((file) => file);
        } else {
            if (!flags.file) {
                throw new Error('No files provided');
            }

            files = flags.file;
        }

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();

        let tagNames: string[];
        if (flags.tagsFileName) {
            const metadata = (await fs.readFile(flags.tagsFileName, 'utf8')).trim();
            const metadataObject = JSON.parse(metadata);
            tagNames = metadataObject.tags;
        } else if (flags.tags) {
            tagNames = (<string>flags.tags).split(', ');
        } else {
            tagNames = [...(flags.tag || [])];
        }

        const tagNamesLower = tagNames.map((n) => n.toLocaleLowerCase());

        const existingTags = allTags.filter((t) => tagNamesLower.includes(t.name.toLocaleLowerCase()));

        const harmonizedFiles = files.map((file) => path.normalize(file));
        const libraryFiles = await library.getFiles(new Query(undefined, harmonizedFiles));

        const results = await library.deleteLinksBetweenTagsAndFiles(existingTags, libraryFiles);
        for (const result of results) {
            winston.info(`Removed ${result.tag.name} from ${result.file.path}`);
        }
    }
}
