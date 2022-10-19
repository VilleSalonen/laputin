import { Command, Flags } from '@oclif/core';

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { SceneDetector } from '../laputin/scenedetector';
import { Query } from '../laputin/query.model';
import { Tag } from '../laputin/tag';

export default class DetectScenesCommand extends Command {
    static description =
        'Detects individual scenes within video files using PySceneDetect';

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
        performFullCheck: Flags.boolean({ default: false }),
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        const { args, flags } = await this.parse(DetectScenesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);
        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();

        const andTags: Tag[] = [];
        const andTagNames: string[] = [
            ...(flags.tag || []),
            ...(flags.and || []),
        ];
        if (andTagNames) {
            andTagNames.forEach((tagName: string) => {
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
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
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
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
                const foundTag = allTags.find(
                    (tag) =>
                        tag.name.toLocaleUpperCase() ===
                        tagName.toLocaleUpperCase()
                );
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

        const query = new Query(
            flags.path,
            [],
            status,
            flags.hash ? [flags.hash] : [],
            andTags.map((tag) => tag.id).join(','),
            orTags.map((tag) => tag.id).join(','),
            notTags.map((tag) => tag.id).join(','),
            false
        );

        const sceneDetector = new SceneDetector(libraryPath, library);
        await sceneDetector.detectMissingScenes(query, flags.performFullCheck);
    }
}
