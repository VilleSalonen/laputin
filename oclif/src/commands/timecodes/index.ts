import { Command, Flags } from '@oclif/core';
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import winston = require('winston');

import { getLibraryPath } from '../../laputin/helpers';
import { Library } from '../../laputin/library';
import { initializeWinston } from '../../laputin/winston';
import { Tag, Timecode } from '../../laputin/tag';
import { Query } from '../../laputin/query.model';

export default class TimecodesCommand extends Command {
    static description = 'Lists timecodes';

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
        verbose: Flags.boolean({ char: 'v', default: false }),
    };

    static args = [{ name: 'file' }];

    public async run(): Promise<void> {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { args, flags } = await this.parse(TimecodesCommand);

        initializeWinston(flags.verbose);

        const libraryPath = await getLibraryPath(flags.library);

        const library = new Library(libraryPath);

        const allTags = await library.getAllTags();

        const andTags: Tag[] = [];
        const andTagNames: string[] = [...(flags.tag || []), ...(flags.and || [])];
        if (andTagNames) {
            andTagNames.forEach((tagName: string) => {
                const foundTag = allTags.find((tag) => tag.name === tagName);
                if (!foundTag) {
                    winston.error(`Could not find tag with name ${tagName}.`);
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
                    winston.error(`Could not find tag with name ${tagName}.`);
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
                    winston.error(`Could not find tag with name ${tagName}.`);
                } else {
                    notTags.push(foundTag);
                }
            });
        }

        const query = new Query(
            flags.path,
            [],
            'tagged',
            flags.hash ? [flags.hash] : [],
            andTags.map((tag) => tag.id).join(','),
            orTags.map((tag) => tag.id).join(','),
            notTags.map((tag) => tag.id).join(','),
            false
        );

        const timecodes = await library.getTimecodes(query);
        const timecodesGroupedByFile = timecodes.reduce((acc, timecode) => {
            if (!acc[timecode.path]) {
                acc[timecode.path] = [];
            }
            acc[timecode.path].push(timecode);
            return acc;
        }, {} as { [key: string]: Timecode[] });

        for (const path in timecodesGroupedByFile) {
            winston.info(path);
            for (const timecode of timecodesGroupedByFile[path]) {
                winston.info(`  ${this.formatPreciseDurationWithMs(timecode.start)}-${this.formatPreciseDurationWithMs(timecode.end)}: ${timecode.timecodeTags.map(t => t.tag.name).join(', ')}`);
            }
        }
    }

    private formatPreciseDurationWithMs(secondsWithDecimals: number): string {
        const MINUTE = 60;
        const HOUR = 60 * 60;

        const ss = ~~secondsWithDecimals % MINUTE;
        const ms = ~~((secondsWithDecimals - ~~secondsWithDecimals) * 1000);
        const mm = ~~((secondsWithDecimals % HOUR) / MINUTE);
        const hh = ~~(secondsWithDecimals / HOUR);

        return `${this.zpad(hh)}:${this.zpad(mm)}:${this.zpad(ss)}.${this.zpad(ms, 3)}`;
    }

    private zpad(initial: number, num = 2, pad = '0'): string {
        let str = '' + initial;
        while (str.length < num) {
            str = pad + str;
        }
        return str;
    }
}
