import { Command, Flags } from '@oclif/core';
import winston = require('winston');

import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { initializeWinston } from '../../laputin/winston';

export default class MergeTagsCommand extends Command {
    static description = 'Merge tags';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        source: Flags.string({ multiple: true, required: true }),
        target: Flags.string({ multiple: false, required: true }),
        verbose: Flags.boolean(),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(MergeTagsCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const sourceTagNames: string[] = flags.source || [];

        if (
            sourceTagNames
                .map((t) => t.toLocaleUpperCase())
                .includes(flags.target.toLocaleUpperCase())
        ) {
            return Promise.reject<void>(
                `Source and target tags are the same!\r\nSource: ${sourceTagNames}\r\nTarget: ${flags.target}`
            );
        }

        const allTags = await library.getAllTags();

        for (const sourceTagName of sourceTagNames) {
            const sourceTagNameUpperCase = sourceTagName.toLocaleUpperCase();
            const sourceTag = allTags.find(
                (t) => t.name.toLocaleUpperCase() === sourceTagNameUpperCase
            );
            if (!sourceTag) {
                winston.warn(
                    `Could not find source tag with name ${sourceTagName}!`
                );
                continue;
            }
            const targetTagNameUpperCase = flags.target.toLocaleUpperCase();
            const targetTag = allTags.find(
                (t) => t.name.toLocaleUpperCase() === targetTagNameUpperCase
            );
            if (!targetTag) {
                winston.warn(
                    `Could not find target tag with name ${flags.target}!`
                );
                continue;
            }
            if (sourceTag.associationCount === 0) {
                winston.warn(
                    `No files are associated with source tag ${sourceTag.name}!`
                );
                continue;
            }

            console.log(
                `Merging tag ${sourceTag.name} to ${targetTag.name}...`
            );

            await library.mergeTags(sourceTag.id, targetTag.id);
            await library.deleteTag(sourceTag.id);
        }
    }
}
