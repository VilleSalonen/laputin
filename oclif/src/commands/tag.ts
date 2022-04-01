import { Command, Flags } from '@oclif/core';
import fs = require('fs');
import { promisify } from 'util';
import winston = require('winston');
const stat = promisify(fs.stat);
import { getLibraryPathByFile } from '../laputin/helpers';
import { IHasher } from '../laputin/ihasher';
import { Library } from '../laputin/library';
import { QuickMD5Hasher } from '../laputin/quickmd5hasher';
import { initializeWinston } from '../laputin/winston';

/*const readPipe: () => Promise<string | undefined> = () => {
    return new Promise((resolve) => {
        const stdin = process.openStdin();
        stdin.setEncoding('utf-8');

        console.log(`tty=${stdin.isTTY}`);
        if (stdin.isTTY) {
            resolve('');
            stdin.end();
            return;
        }

        let data = '';
        stdin.on('data', (chunk) => {
            data += chunk;
        });

        stdin.on('end', () => {
            resolve(data);
        });
    });
};*/

export default class Tag extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        fileName: Flags.string({ required: true }),
        tag: Flags.string({ multiple: true, exclusive: ['tags'] }),
        tags: Flags.string({ exclusive: ['tag'] }),
        tagsFileName: Flags.string(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Tag);

        initializeWinston(flags.verbose);

        /*const stdin = await readPipe();
        console.log('tty');
        console.log(stdin);*/

        if (
            !fs.existsSync(flags.fileName) ||
            !fs.statSync(flags.fileName).isFile()
        ) {
            throw new Error(`File ${flags.fileName} is not a valid file.`);
        }

        const libraryPath = getLibraryPathByFile(flags.fileName);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStats = await stat(flags.fileName);
        const hash = await hasher.hash(flags.fileName, fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

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
        for (const tag of tagsForAdding) {
            const added = await library.createNewLinkBetweenTagAndFile(
                tag,
                file.hash
            );
            if (added) {
                winston.info(`Added: ${tag.name} to ${file.name}`);
            }
        }
    }
}
