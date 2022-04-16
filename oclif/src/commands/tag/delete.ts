import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { initializeWinston } from '../../laputin/winston';
import winston = require('winston');
import { TagQuery } from '../../laputin/tagquery.model';

export default class DeleteTagCommand extends Command {
    static description =
        'Detects individual scenes within video files using PySceneDetect';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'tag', required: true }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(DeleteTagCommand);

        const tagName = <string>args.tag;

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getTags(new TagQuery([], true));
        const tagNameUpper = tagName.toLocaleUpperCase();
        const tag = allTags.find(
            (tag) => tag.name.toLocaleUpperCase() === tagNameUpper
        );

        if (tag) {
            await library.deleteTag(tag.id);
            winston.info(`Deleted tag ${tag.name}`);
        } else {
            winston.error(`Could not find tag with name ${tagName}`);
        }
    }
}
