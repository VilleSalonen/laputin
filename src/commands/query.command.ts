import winston = require('winston');
import commandLineArgs = require('command-line-args');

import { Command } from './command';
import { getLibraryPath } from '..';
import { Library } from '../library';
import { Tag } from '../tag';
import { Query } from '../query.model';

export class QueryCommand implements Command {
    public optionDefinitions: commandLineArgs.OptionDefinition[] = [
        { name: 'libraryPath', type: String, defaultOption: true },
        { name: 'fileName', type: String },
        { name: 'hash', type: String },
        { name: 'tag', type: String, multiple: true },
        { name: 'and', type: String, multiple: true },
        { name: 'or', type: String, multiple: true },
        { name: 'not', type: String, multiple: true },
        { name: 'tagged', type: Boolean },
        { name: 'untagged', type: Boolean },
        { name: 'json', type: Boolean },
        { name: 'pretty', type: Boolean }
    ];

    public async execute(options: any): Promise<void> {
        if (options.tagged && options.untagged) {
            winston.error(
                '--tagged and --untagged are mutually exclusive. Use only one at a time.'
            );
            process.exit(-1);
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
                    winston.error(`Could not find tag with name ${tagName}.`);
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
                    winston.error(`Could not find tag with name ${tagName}.`);
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
                    winston.error(`Could not find tag with name ${tagName}.`);
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
        const files = await library.getFiles(query);
        if (options.json) {
            if (options.pretty) {
                files.forEach(file => {
                    console.log(file);
                });
            } else {
                console.log(JSON.stringify(files));
            }
        } else {
            files.forEach(file => {
                console.log(file.path);
            });
        }
    }
}
