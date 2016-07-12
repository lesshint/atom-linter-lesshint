'use babel';

import path from 'path';
import configLoader from 'lesshint/lib/config-loader';

export default class LinterLesshint {
    static config = {
        onlyWithRc: {
            default: false,
            title: 'Disable linter when no `.lesshintrc` is found in project.',
            type: 'boolean',
        },
        globalConfig: {
            default: false,
            title: 'Use global configuration file?',
            type: 'boolean'
        }
    }

    static get onlyWithRc () {
        return atom.config.get('linter-lesshint.onlyWithRc');
    }

    static get globalConfig () {
        return atom.config.get('linter-lesshint.globalConfig');
    }

    static activate () {
        require('atom-package-deps').install('linter-lesshint');
    }

    static provideLinter () {
        const Lesshint = require('lesshint');
        const Helpers = require('atom-linter');

        return {
            name: 'lesshint',
            grammarScopes: ['source.css.less'],
            scope: 'file',
            lintOnFly: true,
            lint: async (editor) => {
                const lesshint = new Lesshint();
                const text = editor.getText();
                const filePath = editor.getPath();
                let configFile = await Helpers.findCachedAsync(path.dirname(filePath), '.lesshintrc');

                if (!configFile && this.globalConfig) {
                    configFile = await Helpers.findCachedAsync(__dirname, '.lesshintrc');
                }

                if (!configFile && this.onlyWithRc) {
                    return [];
                }

                let config = {};

                try {
                    if (configFile) {
                        config = configLoader(configFile);
                    }
                } catch (e) {
                    atom.notifications.addError("Something's wrong with the `.lesshintrc` file.", {
                        dismissable: true,
                    });
                }

                lesshint.configure(config);

                let errors = [];

                try {
                    errors = lesshint.checkString(text, filePath);
                } catch (e) {
                    atom.notifications.addError("lesshint couldn't check this file.", {
                        detail: e.stack,
                        dismissable: true
                    });
                }

                return errors.map(({ linter, message, line, column, severity }) => {
                    line = line || editor.getLineCount();

                    const range = Helpers.rangeFromLineNumber(editor, line - 1, column - 1);

                    const type = severity;
                    const html = `<span class='badge badge-flexible'>${linter}</span> ${message}`;

                    return { type, html, filePath, range };
                });
            }
        };
    }
}
