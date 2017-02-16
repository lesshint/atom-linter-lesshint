'use babel';

import { findCachedAsync, generateRange } from 'atom-linter';
import { Lesshint } from 'lesshint';
import path from 'path';
import os from 'os';

export default class LinterLesshint {
    static config = {
        onlyWithRc: {
            default: false,
            title: 'Disable linter when no `.lesshintrc` is found in project.',
            type: 'boolean',
        },
        globalConfig: {
            default: false,
            title: 'Use a global configuration file?',
            type: 'boolean',
        },
        globalConfigDir: {
            default: os.homedir(),
            title: 'Path to directory of global configuration file',
            type: 'string',
        }
    }

    static get onlyWithRc () {
        return atom.config.get('linter-lesshint.onlyWithRc');
    }

    static get globalConfigDir () {
        return atom.config.get('linter-lesshint.globalConfigDir');
    }

    static get globalConfig () {
        return atom.config.get('linter-lesshint.globalConfig');
    }

    static activate () {
        require('atom-package-deps').install('linter-lesshint');
    }

    static provideLinter () {
        return {
            name: 'lesshint',
            grammarScopes: ['source.css.less'],
            scope: 'file',
            lintOnFly: true,
            lint: async (editor) => {
                const lesshint = new Lesshint();
                const filePath = editor.getPath();

                let configFile = await findCachedAsync(path.dirname(filePath), '.lesshintrc');

                if (!configFile && this.globalConfig) {
                    configFile = await findCachedAsync(this.globalConfigDir, '.lesshintrc');
                }

                if (!configFile && this.onlyWithRc) {
                    return [];
                }

                let config = {};

                try {
                    if (configFile) {
                        config = lesshint.getConfig(configFile);
                    }
                } catch (e) {
                    atom.notifications.addError("Something's wrong with the `.lesshintrc` file.", {
                        dismissable: true,
                    });
                }

                lesshint.configure(config);

                let errors = [];

                try {
                    const text = editor.getText();

                    errors = lesshint.checkString(text, filePath);
                } catch (e) {
                    atom.notifications.addError("lesshint couldn't check this file.", {
                        detail: e.stack,
                        dismissable: true
                    });
                }

                return errors.map(({ linter, message, line, column, severity }) => {
                    line = line || editor.getLineCount();

                    const range = generateRange(editor, line - 1, column - 1);

                    const type = severity;
                    const html = `<span class='badge badge-flexible'>${linter}</span> ${message}`;

                    return { type, html, filePath, range };
                });
            }
        };
    }
}
