import * as chai from 'chai';
const expect = chai.expect;

import {FileQuery} from './filequery';
import {Tag} from './tag';

describe('File Query', function() {
    it('Filename defaults to empty string', () => {
        const query = new FileQuery();
        expect(query.filename).to.be('');
    });

    it('Filename is cleared', () => {
        const query = new FileQuery();

        query.filename = 'moses.jpg';
        query.clear();

        expect(query.filename).to.be('');
    });

    it('Status defaults to \'both\'', () => {
        const query = new FileQuery();
        expect(query.status).to.eql('both');
    });

    it('Status is cleared', () => {
        const query = new FileQuery();

        query.status = 'tagged';
        query.clear();

        expect(query.status).to.eql('both');
    });

    it('All tags are combined into tags property', () => {
        const query = new FileQuery();
        const andTag = new Tag(12, 'Absolutely', 0);
        const orTag = new Tag(23, 'Can be', 0);

        query.andTag(andTag);
        query.orTag(orTag);

        expect(query.tags).to.eql([andTag, orTag]);
    });

    it('AND tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);

        expect(query.andTags).to.eql([tag]);
    });

    it('AND tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.andTag(funny);
        query.andTag(hilarious);

        query.removeTag(funny);

        expect(query.andTags).to.eql([hilarious]);
    });

    it('AND tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);
        query.clear();

        expect(query.andTags).to.eql([]);
    });

    it('OR tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.orTag(tag);

        expect(query.orTags).to.eql([tag]);
    });

    it('OR tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.orTag(funny);
        query.orTag(hilarious);

        query.removeTag(funny);

        expect(query.orTags).to.eql([hilarious]);
    });

    it('OR tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.orTag(tag);
        query.clear();

        expect(query.orTags).to.eql([]);
    });

    it('NOT tags can be added', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.notTag(tag);

        expect(query.notTags).to.eql([tag]);
    });

    it('NOT tags can be removed', () => {
        const query = new FileQuery();
        const funny = new Tag(23, 'Funny', 0);
        const hilarious = new Tag(235, 'Hilarious', 0);

        query.notTag(funny);
        query.notTag(hilarious);

        query.removeTag(funny);

        expect(query.notTags).to.eql([hilarious]);
    });

    it('NOT tags are cleared', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.notTag(tag);
        query.clear();

        expect(query.notTags).to.eql([]);
    });

    it('Tag status can be changed', () => {
        const query = new FileQuery();
        const tag = new Tag(23, 'Funny', 0);

        query.andTag(tag);
        expect(query.andTags).to.eql([tag]);
        expect(query.orTags).to.eql([]);
        expect(query.notTags).to.eql([]);

        query.orTag(tag);
        expect(query.andTags).to.eql([]);
        expect(query.orTags).to.eql([tag]);
        expect(query.notTags).to.eql([]);

        query.notTag(tag);
        expect(query.andTags).to.eql([]);
        expect(query.orTags).to.eql([]);
        expect(query.notTags).to.eql([tag]);
    });
});
