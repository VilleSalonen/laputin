import { Command, Flags } from '@oclif/core';
import fs = require('fs');
import os = require('os');
import path = require('path');
import winston = require('winston');

import { getLibraryPathByFile } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { readPipe } from '../../laputin/read-pipe';
import { initializeWinston } from '../../laputin/winston';
import { Query } from '../../laputin/query.model';

export default class TagCommand extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
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
        const { args, flags } = await this.parse(TagCommand);

        initializeWinston(flags.verbose);

        var files = [];
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

        const libraryPath = await getLibraryPathByFile(files[0]);
        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();

        let tagNames: string[];
        if (flags.tagsFileName) {
            const metadata = fs.readFileSync(flags.tagsFileName, 'utf8').trim();
            const metadataObject = JSON.parse(metadata);
            tagNames = metadataObject.tags;
        } else if (flags.tags) {
            tagNames = (<string>flags.tags).split(', ');
        } else {
            tagNames = [...(flags.tag || [])];
        }

        const tagNamesLower = tagNames.map((n) => n.toLocaleLowerCase());

        const existingTags = allTags.filter((t) =>
            tagNamesLower.includes(t.name.toLocaleLowerCase())
        );
        const existingTagNames = existingTags.map((t) =>
            t.name.toLocaleLowerCase()
        );
        const newTagNames = tagNames.filter(
            (n) => !existingTagNames.includes(n.toLocaleLowerCase())
        );
        const newTags = [];
        for (const newTagName of newTagNames) {
            winston.info(`Creating new tag "${newTagName}"...`);
            const newTag = await library.createNewTag(newTagName);
            winston.info(`Created new tag "${newTagName}".`);
            newTags.push(newTag);
        }

        const tagsForAdding = [...newTags, ...existingTags];

        const harmonizedFiles = files.map((file) => path.normalize(file));
        const filesForAdding = await library.getFiles(
            new Query(undefined, harmonizedFiles)
        );

        const results = await library.createNewLinksBetweenTagsAndFiles(
            tagsForAdding,
            filesForAdding
        );
        for (const result of results) {
            winston.info(`Added ${result.tag.name} to ${result.file.path}`);
        }
    }
}
