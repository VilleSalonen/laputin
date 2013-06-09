'use strict';

describe('my app', function () {
    beforeEach(function () {
        browser().navigateTo('index.html');
    });


    it('should automatically redirect to /files when location hash/fragment is empty', function () {
        expect(browser().location().url()).toBe("/files/");
    });


    describe('general', function () {
        beforeEach(function () {
            browser().navigateTo('#/files');
        });

        it('file amount should match physical files', function () {
            expect(element('.nav li:first').text()).toBe("Files (4)");
        });
    });

    describe('tags', function () {
        beforeEach(function () {
            browser().navigateTo('#/tags');
        });


        it('should render tags when user navigates to /tags', function () {
            expect(element('h1').text()).toMatch("Tags");
            expect(element("li.ng-scope", "Foo").count()).toBe(0);
        });
    });
});
