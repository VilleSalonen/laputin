'use strict';

/* http://docs.angularjs.org/guide/dev_guide.e2e-testing */

describe('my app', function () {
    beforeEach(function () {
        browser().navigateTo('index.html');
    });


    it('should automatically redirect to /files when location hash/fragment is empty', function () {
        //expect(browser().location().url()).toBe("/files");
    });


    describe('files', function () {
        beforeEach(function () {
            browser().navigateTo('#/files');
        });


        it('should render files when user navigates to /files', function () {
            expect(element('a.brand').text()).toMatch("Laputin");
        });
    });


    describe('tags', function () {
        beforeEach(function () {
            browser().navigateTo('#/tags');
        });


        it('should render tags when user navigates to /tags', function () {
            /*expect(element('h1').text()).
             toMatch(/partial for view 2/);*/
        });
    });
});
