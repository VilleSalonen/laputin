basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'app/components/angular/angular.js',
  //'app/components/angular/angular-*.js',
  'test/lib/angular/angular-mocks.js',
  'app/js/bundle.js',
  'test/unit/**/*.js'
];

autoWatch = true;

browsers = ['PhantomJS'];

junitReporter = {
  outputFile: 'test_out/unit.xml',
  suite: 'unit'
};

reporters = ['progress', 'growl'];
