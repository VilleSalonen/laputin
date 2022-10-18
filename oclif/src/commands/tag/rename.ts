import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { initializeWinston } from '../../laputin/winston';
import winston = require('winston');

export default class RenameTagCommand extends Command {
    static description = 'Renames a tag';

    static examples = [
        '<%= config.bin %> <%= command.id %> "Old name" "New name"',
    ];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [
        { name: 'oldTagName', required: true },
        { name: 'newTagName', required: true },
    ];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(RenameTagCommand);

        const oldTagName = <string>args.oldTagName;
        const newTagName = <string>args.newTagName;

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();
        const oldTagNameUpper = oldTagName.toLocaleUpperCase();
        const oldTag = allTags.find(
            (tag) => tag.name.toLocaleUpperCase() === oldTagNameUpper
        );

        if (oldTag) {
            await library.renameTag(oldTag.id, newTagName);
            winston.info(`Renamed tag ${oldTag.name} to ${newTagName}`);
        } else {
            winston.error(`Could not find tag with name ${oldTagName}`);
        }
    }
}
