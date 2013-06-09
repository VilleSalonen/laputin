basePath = '../';

files = [
    JASMINE,
    JASMINE_ADAPTER,

    // libs required for test framework
    'node_modules/chai/chai.js',
    'node_modules/sinon/pkg/sinon.js',

    'app/components/underscore/underscore.js',
    'app/components/angular/angular.js',
    //'app/components/angular/angular-*.js',
    'test/lib/angular/angular-mocks.js',
    'app/js/bundle.js',
    'test/unit/**/*Spec.js'
];

autoWatch = true;

browsers = ['PhantomJS'];

junitReporter = {
    outputFile: 'test_out/unit.xml',
    suite: 'unit'
};

reporters = ['progress'];
