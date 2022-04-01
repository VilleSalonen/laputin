declare var describe: any;
declare var it: any;
declare var expect: any;

import { FileQuery } from './filequery';
import { Tag } from './tag';

describe('File Query', function() {
    it('Filename defaults to empty string', () => {
        const query = new FileQuery();
        expect(query.filename).toEqual('');
    });

    it('Filename is cleared', () => {
        const query = new FileQuery();

        query.filename = 'moses.jpg';
        query.clear();

        expect(query.filename).toEqual('');
    });

    it('Status defaults to Both', () => {
        const query = new FileQuery();
        expect(query.status).toEqual('both');
    });

    it('Status is cleared', () => {
        const query = new FileQuery();

        query.status = 'tagged';
        query.clear();

        expect(query.status).toEqual('both');
    });

    it('All tags are combined into tags property', () => {
        const query = new FileQuery();
        const andTag = new Tag(12, 'Absolutely', 0);
        const orTag = new Tag(23, 'Can be', 0);

        query.andTag(andTag);
        query.orTag(orTag);

        expect(query.tags).toEqual([andTag, orTag]);
    });

    it('AND tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);

        expect(query.andTags).toEqual([tag]);
    });

    it('AND tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.andTag(funny);
        query.andTag(hilarious);

        query.removeTag(funny);

        expect(query.andTags).toEqual([hilarious]);
    });

    it('AND tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);
        query.clear();

        expect(query.andTags).toEqual([]);
    });

    it('OR tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.orTag(tag);

        expect(query.orTags).toEqual([tag]);
    });

    it('OR tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.orTag(funny);
        query.orTag(hilarious);

        query.removeTag(funny);

        expect(query.orTags).toEqual([hilarious]);
    });

    it('OR tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.orTag(tag);
        query.clear();

        expect(query.orTags).toEqual([]);
    });

    it('NOT tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.notTag(tag);

        expect(query.notTags).toEqual([tag]);
    });

    it('NOT tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.notTag(funny);
        query.notTag(hilarious);

        query.removeTag(funny);

        expect(query.notTags).toEqual([hilarious]);
    });

    it('NOT tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.notTag(tag);
        query.clear();

        expect(query.notTags).toEqual([]);
    });

    it('Tag status can be changed', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);
        expect(query.andTags).toEqual([tag]);
        expect(query.orTags).toEqual([]);
        expect(query.notTags).toEqual([]);

        query.orTag(tag);
        expect(query.andTags).toEqual([]);
        expect(query.orTags).toEqual([tag]);
        expect(query.notTags).toEqual([]);

        query.notTag(tag);
        expect(query.andTags).toEqual([]);
        expect(query.orTags).toEqual([]);
        expect(query.notTags).toEqual([tag]);
    });
});
