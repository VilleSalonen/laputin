import fs = require('fs');
import winston = require('winston');
import commandLineArgs = require('command-line-args');
import child_process = require('child_process');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import { Tag, Timecode } from '../tag';
import { Query } from '../query.model';

class ExportJob {
    constructor(public timecode: Timecode, public exportCommand: string) {}
}

export class ExportTimecodesCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String, defaultOption: true },
        { name: 'targetDirectory', type: String },
        { name: 'fileName', type: String },
        { name: 'hash', type: String },
        { name: 'tag', type: String, multiple: true },
        { name: 'and', type: String, multiple: true },
        { name: 'or', type: String, multiple: true },
        { name: 'not', type: String, multiple: true }
    ];

    public async execute(options: any): Promise<void> {
        if (
            !fs.existsSync(options.targetDirectory) ||
            !fs.statSync(options.targetDirectory).isDirectory()
        ) {
            throw new Error(
                `Directory ${options.targetDirectory} is not a valid directory.`
            );
        }

        const libraryPath = getLibraryPath(options.libraryPath);

        const library = new Library(libraryPath);

        const allTags = await library.getTags(undefined);

        const andTags: Tag[] = [];
        const andTagNames: string[] = [
            ...(options.tag || []),
            ...(options.and || [])
        ];
        if (andTagNames) {
            andTagNames.forEach((tagName: string) => {
                const foundTag = allTags.find(tag => tag.name === tagName);
                if (!foundTag) {
                    winston.error(`Could not found tag with name ${tagName}.`);
                } else {
                    andTags.push(foundTag);
                }
            });
        }

        const orTags: Tag[] = [];
        if (options.or) {
            options.or.forEach((tagName: string) => {
                const foundTag = allTags.find(tag => tag.name === tagName);
                if (!foundTag) {
                    winston.error(`Could not found tag with name ${tagName}.`);
                } else {
                    orTags.push(foundTag);
                }
            });
        }

        const notTags: Tag[] = [];
        if (options.not) {
            options.not.forEach((tagName: string) => {
                const foundTag = allTags.find(tag => tag.name === tagName);
                if (!foundTag) {
                    winston.error(`Could not found tag with name ${tagName}.`);
                } else {
                    notTags.push(foundTag);
                }
            });
        }

        let status = '';
        if (options.tagged) {
            status = 'tagged';
        } else if (options.untagged) {
            status = 'untagged';
        }

        const query = new Query(
            options.fileName || '',
            status,
            options.hash || '',
            andTags.map(tag => tag.id).join(','),
            orTags.map(tag => tag.id).join(','),
            notTags.map(tag => tag.id).join(','),
            false
        );

        const timecodes = await library.getTimecodes(query);
        const exportJobs: ExportJob[] = timecodes.map(t => {
            const name = t.path.substring(t.path.lastIndexOf('/') + 1);
            const tags = t.timecodeTags.map(ta => ta.tag.name).join(', ');

            const exportCommand = `ffmpeg -ss ${this.formatPreciseDurationWithMs(
                t.start
            )} -i "${t.path.replace(
                /\//g,
                '\\'
            )}" -t ${this.formatPreciseDurationWithMs(
                t.end - t.start
            )} -map v? -map a? -map s? -c:v hevc_nvenc -c:a copy -profile:v main -preset slow "${
                options.targetDirectory
            }\\${name} [${tags}].mp4"`;

            return new ExportJob(t, exportCommand);
        });

        exportJobs.forEach(exportJob => {
            const tags = exportJob.timecode.timecodeTags
                .map(ta => ta.tag.name)
                .join(', ');
            winston.info(
                `Exporting ${
                    exportJob.timecode.path
                } timecode ${this.formatPreciseDurationWithMs(
                    exportJob.timecode.start
                )}-${this.formatPreciseDurationWithMs(
                    exportJob.timecode.end
                )} with tags ${tags}...`
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

        return `${this.zpad(hh)}:${this.zpad(mm)}:${this.zpad(ss)}.${this.zpad(
            ms,
            3
        )}`;
    }

    private zpad(initial: number, num = 2, pad = '0'): string {
        let str = '' + initial;
        while (str.length < num) {
            str = pad + str;
        }
        return str;
    }
}
