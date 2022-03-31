import fs = require('fs');
import winston = require('winston');
import { promisify } from 'util';
const stat = promisify(fs.stat);
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPathByFile } from '..';
import { Library } from '../library';
import { IHasher } from '../ihasher';
import { QuickMD5Hasher } from '../quickmd5hasher';

export class TagCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'fileName', type: String },
        { name: 'tag', type: String, multiple: true },
        { name: 'tags', type: String },
        { name: 'tagsFileName', type: String },
    ];

    public async execute(options: any): Promise<void> {
        if (
            !fs.existsSync(options.fileName) ||
            !fs.statSync(options.fileName).isFile()
        ) {
            throw new Error(
                `Directory ${options.fileName} is not a valid file.`
            );
        }

        const libraryPath = getLibraryPathByFile(options.fileName);
        const library = new Library(libraryPath);

        const hasher: IHasher = new QuickMD5Hasher();

        const fileStats = await stat(options.fileName);
        const hash = await hasher.hash(options.fileName, fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        const allTags = await library.getTags({ selectedTags: [], unassociated: true });

        let tagNames: string[];
        if (options.tagsFileName) {
            const metadata = fs.readFileSync(options.tagsFileName, 'utf8').trim();
            const metadataObject = JSON.parse(metadata);
            tagNames = metadataObject.tags;
        } else if (options.tags) {
            tagNames = (<string>options.tags).split(", ");
        } else {
            tagNames = [...(options.tag || [])];
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
            const added = await library.createNewLinkBetweenTagAndFile(tag, file.hash);
            if (added) {
                winston.info(`Added: ${tag.name} to ${file.name}`);
            }
        }
    }
}
