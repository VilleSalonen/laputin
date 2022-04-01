/**
 * CSS property list: https://github.com/brandon-rhodes/Concentric-CSS/blob/master/style.css
 * CSS stylelint config: https://github.com/stylelint/stylelint-config-standard/blob/master/index.js
 */
module.exports = {
    syntax: 'postcss-scss',
    plugins: {
        'postcss-sorting': require('./.postcss-sorting.json'),
        stylefmt: require('./.stylelintrc.json')
    }
};
