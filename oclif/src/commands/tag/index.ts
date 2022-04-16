import { Command, Flags } from '@oclif/core';
import * as fs from 'fs';
import { promisify } from 'util';
import winston = require('winston');
const stat = promisify(fs.stat);
const { EOL } = require('os');
import { getLibraryPathByFile } from '../../laputin/helpers';
import { IHasher } from '../../laputin/ihasher';
import { Library } from '../../laputin/library';
import { QuickMD5Hasher } from '../../laputin/quickmd5hasher';
import { readPipe } from '../../laputin/read-pipe';
import { initializeWinston } from '../../laputin/winston';

export default class Tag extends Command {
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
        const { args, flags } = await this.parse(Tag);

        initializeWinston(flags.verbose);

        var files = [];
        if (flags.stdinFile) {
            const stdin = this.stdin;
            if (!stdin) {
                throw new Error('No files provided via stdin');
            }

            files = stdin.split(EOL).filter((file) => file);
        } else {
            if (!flags.file) {
                throw new Error('No files provided');
            }

            files = flags.file;
        }

        for (const file of files) {
            if (file && (!fs.existsSync(file) || !fs.statSync(file).isFile())) {
                throw new Error(`File ${file} is not a valid file.`);
            }
        }

        const libraryPath = getLibraryPathByFile(files[0]);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();
        const allTags = await library.getTags({
            selectedTags: [],
            unassociated: true,
        });

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
        for (const file of files) {
            const fileStats = await stat(file);
            const hash = await hasher.hash(file, fileStats);
            const libraryFile = await library.getFile(hash);
            if (!libraryFile) {
                throw new Error(`Could not find file with hash ${hash}!`);
            }

            for (const tag of tagsForAdding) {
                const added = await library.createNewLinkBetweenTagAndFile(
                    tag,
                    libraryFile.hash
                );
                if (added) {
                    winston.info(`Added: ${tag.name} to ${libraryFile.name}`);
                }
            }
        }
    }
}