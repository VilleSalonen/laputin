import fs = require('fs');
import winston = require('winston');
import { promisify } from 'util';
const stat = promisify(fs.stat);
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import path = require('path');
import { LaputinConfiguration } from '../laputinconfiguration';
import { IHasher } from '../ihasher';
import { QuickMD5Hasher } from '../quickmd5hasher';
import { XxhashHasher } from '../xxhashhasher';

export class TagCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String },
        { name: 'fileName', type: String },
        { name: 'tag', type: String, multiple: true },
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

        const libraryPath = getLibraryPath(options.libraryPath);
        const library = new Library(libraryPath);

        const configFilePath = path.join(options.libraryPath, '.laputin.json');
        const configuration: LaputinConfiguration = fs.existsSync(
            configFilePath
        )
            ? JSON.parse(fs.readFileSync(configFilePath, 'utf8'))
            : new LaputinConfiguration(3200, 'quick', null, []);

        let hasher: IHasher = new QuickMD5Hasher();
        if (
            configuration.identification &&
            configuration.identification === 'accurate'
        ) {
            hasher = new XxhashHasher();
        }

        const fileStats = await stat(options.fileName);
        const hash = await hasher.hash(options.fileName, fileStats);
        const file = await library.getFile(hash);
        if (!file) {
            throw new Error(`Could not find file with hash ${hash}!`);
        }

        const allTags = await library.getTags(undefined);

        const tagNames: string[] = [...(options.tag || [])];

        const existingTags = allTags.filter((t) => tagNames.includes(t.name));
        const existingTagNames = existingTags.map((t) => t.name);
        const newTagNames = tagNames.filter(
            (n) => !existingTagNames.includes(n)
        );
        const newTags = [];
        for (const newTagName of newTagNames) {
            const newTag = await library.createNewTag(newTagName);
            newTags.push(newTag);
        }

        for (const existingTag of existingTags) {
            console.log(JSON.stringify(existingTag));
        }

        const tagsForAdding = [...newTags, ...existingTags];
        for (const tag of tagsForAdding) {
            winston.verbose(`Adding ${tag.name} to ${file.name}`);
            await library.createNewLinkBetweenTagAndFile(tag, file.hash);
        }
    }
}
