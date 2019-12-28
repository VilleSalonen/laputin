import chai = require('chai');
const expect = chai.expect;

import { XxhashHasher } from './../xxhashhasher';
import { QuickMD5Hasher } from './../quickmd5hasher';

describe('Hasher tests', function() {
    it('Xxhash hasher', async () => {
        const hasher = new XxhashHasher();
        const fakeStats: any = { size: 30791 };
        const hash = await hasher.hash(
            'tests/test-content/cats.jpg',
            fakeStats
        );

        const expectedHash = '26199938';
        expect(hash).to.eql(expectedHash);
    });

    it('Quick MD5 hasher', async () => {
        const hasher = new QuickMD5Hasher();
        const fakeStats: any = { size: 30791 };
        const hash = await hasher.hash(
            'tests/test-content/cats.jpg',
            fakeStats
        );

        expect(hash).to.eql('ea411d1af31ebb729a37c58c8e34236c');
    });
});
