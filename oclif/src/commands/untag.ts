import { Command, Flags } from '@oclif/core';
import { EOL } from 'os';
import * as fs from 'fs';
import { readPipe } from '../laputin/read-pipe';
import { initializeWinston } from '../laputin/winston';
import { getLibraryPathByFile } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { IHasher } from '../laputin/ihasher';
import winston = require('winston');
import { File as LaputinFile } from '../laputin/file';

export default class Untag extends Command {
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
        const { args, flags } = await this.parse(Untag);

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

        const libraryPath = getLibraryPathByFile(files[0]);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

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
        const filesForUntagging: LaputinFile[] = [];
        for (const file of files) {
            if (file && (!fs.existsSync(file) || !fs.statSync(file).isFile())) {
                winston.warn(`File ${file} is not a valid file.`);
                continue;
            }

            const fileStats = fs.statSync(file);
            const hash = await hasher.hash(file, fileStats);
            const libraryFile = await library.getFile(hash);
            if (!libraryFile) {
                throw new Error(`Could not find file with hash ${hash}!`);
            }

            filesForUntagging.push(libraryFile);
        }

        const results = await library.deleteLinksBetweenTagsAndFiles(
            existingTags,
            filesForUntagging
        );
        for (const result of results) {
            winston.info(`Removed ${result.tag.name} from ${result.file.path}`);
        }
    }
}
