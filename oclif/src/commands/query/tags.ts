import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { Tag } from '../../laputin/tag';
import { TagQuery } from '../../laputin/tagquery.model';
import { Query as QueryModel } from '../../laputin/query.model';
import { initializeWinston } from '../../laputin/winston';

export default class QueryTagsCommand extends Command {
    static description = 'Query tags';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        associatedOnly: Flags.boolean({
            description: 'Only searches tags with associated files',
            default: true,
        }),
        json: Flags.boolean(),
        pretty: Flags.boolean(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'tag', required: true }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(QueryTagsCommand);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const tagQuery = flags.associatedOnly
            ? TagQuery.allAssociated()
            : TagQuery.allUnassociated();
        const allTags = await library.getTags(tagQuery);

        const tagName = <string>args.tag;
        const tagNameUpper = tagName.toLocaleUpperCase();

        const matchingTags = allTags.filter((tag) =>
            tag.name.toLocaleUpperCase().includes(tagNameUpper)
        );

        if (flags.json) {
            if (flags.pretty) {
                matchingTags.forEach((tag) => {
                    console.log(tag);
                });
            } else {
                console.log(JSON.stringify(matchingTags));
            }
        } else {
            matchingTags.forEach((tag) => {
                console.log(tag.name);
            });
        }
    }
}
