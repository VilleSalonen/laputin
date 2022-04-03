import { Command, Flags } from '@oclif/core';
import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { Tag } from '../laputin/tag';
import { TagQuery } from '../laputin/tagquery.model';
import { Query as QueryModel } from '../laputin/query.model';
import { initializeWinston } from '../laputin/winston';

export default class Query extends Command {
    static description = 'describe the command here';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        path: Flags.string({ char: 'p' }),
        hash: Flags.string(),
        tag: Flags.string({ multiple: true }),
        and: Flags.string({ multiple: true }),
        or: Flags.string({ multiple: true }),
        not: Flags.string({ multiple: true }),
        tagged: Flags.boolean({ exclusive: ['untagged'] }),
        untagged: Flags.boolean({ exclusive: ['tagged'] }),
        json: Flags.boolean(),
        pretty: Flags.boolean(),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(Query);

        initializeWinston(flags.verbose);

        const libraryPath = getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getTags(new TagQuery([], true));

        const andTags: Tag[] = [];
        const andTagNames: string[] = [
            ...(flags.tag || []),
            ...(flags.and || []),
        ];
        if (andTagNames) {
            andTagNames.forEach((tagName: string) => {
                const foundTag = allTags.find((tag) => tag.name === tagName);
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    andTags.push(foundTag);
                }
            });
        }

        const orTags: Tag[] = [];
        if (flags.or) {
            flags.or.forEach((tagName: string) => {
                const foundTag = allTags.find((tag) => tag.name === tagName);
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    orTags.push(foundTag);
                }
            });
        }

        const notTags: Tag[] = [];
        if (flags.not) {
            flags.not.forEach((tagName: string) => {
                const foundTag = allTags.find((tag) => tag.name === tagName);
                if (!foundTag) {
                    throw new Error(`Could not find tag with name ${tagName}.`);
                } else {
                    notTags.push(foundTag);
                }
            });
        }

        let status = '';
        if (flags.tagged) {
            status = 'tagged';
        } else if (flags.untagged) {
            status = 'untagged';
        }

        const query = new QueryModel(
            flags.path || '',
            status,
            flags.hash || '',
            andTags.map((tag) => tag.id).join(','),
            orTags.map((tag) => tag.id).join(','),
            notTags.map((tag) => tag.id).join(','),
            false
        );
        const files = await library.getFiles(query);
        if (flags.json) {
            if (flags.pretty) {
                files.forEach((file) => {
                    console.log(file);
                });
            } else {
                console.log(JSON.stringify(files));
            }
        } else {
            files.forEach((file) => {
                console.log(file.path);
            });
        }
    }
}
