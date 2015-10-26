'use babel';

import path from 'path';
import configLoader from 'lesshint/lib/config-loader';
import helper from 'atom-linter';

export default class LinterLesshint {
    static config = {
        onlyWithRc: {
            default: false,
            title: 'Disable linter when no `.lesshintrc` is found in project.',
            type: 'boolean',
        },
    }

    static get onlyWithRc() {
        return atom.config.get('linter-lesshint.onlyWithRc');
    }

    static activate() {
        require('atom-package-deps').install('linter-lesshint');
    }

    static provideLinter() {
        const Lesshint = require('lesshint');
        return {
            name: 'lesshint',
            grammarScopes: ['source.css.less'],
            scope: 'file',
            lintOnFly: true,
            lint: (editor) => {
                const lesshint = new Lesshint();

                const text = editor.getText();
                const filePath = editor.getPath();
                const configFile = helper.findFile(path.dirname(filePath), '.lesshintrc');

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

                const errors = lesshint.checkString(text, filePath);

                return errors.map(({ linter, message, line, column, severity }) => {
                    line = line || editor.getLineCount();

                    const range = helper.rangeFromLineNumber(editor, line - 1, column);

                    const type = severity;
                    const html = `<span class='badge badge-flexible'>${linter}</span> ${message}`;

                    return { type, html, filePath, range };
                });
            }
        }
    }
}
