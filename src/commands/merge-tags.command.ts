import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import { TagQuery } from '../tagquery.model';

export class MergeTagsCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String, defaultOption: true },
        { name: 'sourceTag', type: String },
        { name: 'targetTag', type: String },
    ];

    public async execute(options: any): Promise<void> {
        const libraryPath = getLibraryPath(options.libraryPath);
        const library = new Library(libraryPath);

        const allTags = await library.getTags(new TagQuery(undefined, true));

        if (options.sourceTag === options.targetTag) {
            return Promise.reject<void>('Source and target tags are the same!');
        }

        const sourceTagNameUpperCase = options.sourceTag.toLocaleUpperCase();
        const sourceTag = allTags.find(
            (t) => t.name.toLocaleUpperCase() === sourceTagNameUpperCase
        );
        if (!sourceTag) {
            return Promise.reject<void>(
                `Could not find source tag with name ${options.sourceTag}!`
            );
        }
        const targetTagNameUpperCase = options.targetTag.toLocaleUpperCase();
        const targetTag = allTags.find(
            (t) => t.name.toLocaleUpperCase() === targetTagNameUpperCase
        );
        if (!targetTag) {
            return Promise.reject<void>(
                `Could not find target tag with name ${options.targetTag}!`
            );
        }

        if (sourceTag.associationCount === 0) {
            return Promise.reject<void>(
                `No files are associated with source tag ${sourceTag.name}!`
            );
        }

        console.log(`Merging tag ${sourceTag.name} to ${targetTag.name}...`);

        await library.mergeTags(sourceTag.id, targetTag.id);
        await library.deleteTag(sourceTag.id);
    }
}
