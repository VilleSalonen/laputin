import { Command, Flags } from '@oclif/core';
import child_process = require('child_process');
import fs = require('fs/promises');
import * as fsLegacy from 'fs';
import winston = require('winston');

import { getLibraryPath } from '../laputin/helpers';
import { Library } from '../laputin/library';
import { initializeWinston } from '../laputin/winston';
import { Tag, Timecode } from '../laputin/tag';
import { Query } from '../laputin/query.model';

export default class ExportTimecodesCommand extends Command {
    static description = 'Exports timecodes using ffmpeg';

    static examples = ['<%= config.bin %> <%= command.id %>'];

    static flags = {
        library: Flags.string({
            char: 'l',
            description: 'Laputin library path',
            required: true,
        }),
        targetDirectory: Flags.string({ required: true }),
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
        const { args, flags } = await this.parse(ExportTimecodesCommand);

        initializeWinston(flags.verbose);

        if (!fsLegacy.existsSync(flags.targetDirectory) || !(await fs.stat(flags.targetDirectory)).isDirectory()) {
            throw new Error(`Directory ${flags.targetDirectory} is not a valid directory.`);
        }

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
        const exportJobs: ExportJob[] = timecodes.map((t) => {
            const name = t.path.substring(t.path.lastIndexOf('/') + 1);
            const tags = t.timecodeTags.map((ta) => ta.tag.name).join(', ');

            const exportCommand = `ffmpeg -ss ${this.formatPreciseDurationWithMs(t.start)} -i "${t.path.replace(
                /\//g,
                '\\'
            )}" -t ${this.formatPreciseDurationWithMs(
                t.end - t.start
            )} -map v? -map a? -map s? -c:v hevc_nvenc -c:a copy -profile:v main -preset slow "${
                flags.targetDirectory
            }\\${name} [${tags}].mp4"`;

            return new ExportJob(t, exportCommand);
        });

        exportJobs.forEach((exportJob) => {
            const tags = exportJob.timecode.timecodeTags.map((ta) => ta.tag.name).join(', ');
            winston.info(
                `Exporting ${exportJob.timecode.path} timecode ${this.formatPreciseDurationWithMs(
                    exportJob.timecode.start
                )}-${this.formatPreciseDurationWithMs(exportJob.timecode.end)} with tags ${tags}...`
            );
            child_process.execSync(exportJob.exportCommand);
        });
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

class ExportJob {
    constructor(public timecode: Timecode, public exportCommand: string) {}
}
