'use babel';

import linter from '../index';

describe('The lesshint provider for Linter', () => {
    const lint = linter.provideLinter().lint;

    beforeEach(() => {
        waitsForPromise(() => {
            atom.packages.activatePackage('linter-lesshint');

            return atom.packages.activatePackage('language-less');
        });
    });

    describe('lesshint-breaking files checks', () => {
        let editor;

        beforeEach(() => {
            waitsForPromise(() => {
                return atom.workspace.open(`${__dirname}/fixtures/lesshint-breaker.less`).then((openEditor) => {
                    editor = openEditor;
                });
            });
        });

        it('fails file that breaks lesshint', () => {
            waitsForPromise(() => {
                const priorNotificationsCount = atom.notifications.getNotifications().length;

                return lint(editor).then(() => {
                    const notifications = atom.notifications.getNotifications();

                    expect(notifications[priorNotificationsCount].getType()).toEqual('error');
                    expect(notifications[priorNotificationsCount].getMessage()).toEqual("lesshint couldn't check this file.");
                });
            });
        });
    });

    describe('invalid files checks', () => {
        const Range = require('atom').Range;

        let editor;

        beforeEach(() => {
            waitsForPromise(() => {
                return atom.workspace.open(`${__dirname}/fixtures/invalid.less`).then((openEditor) => {
                    editor = openEditor;
                });
            });
        });

        it('fails file with errors', () => {
            const errorMessage = "There shouldn't be any empty rules present.";
            const errorName = 'emptyRule';

            waitsForPromise(() => {
                return lint(editor).then((messages) => {
                    expect(messages[0].type).toEqual('warning');
                    expect(messages[0].html).toEqual(`<span class='badge badge-flexible'>${errorName}</span> ${errorMessage}`);
                    expect(messages[0].filePath).toMatch(/.+invalid\.less$/);
                    expect(messages[0].range).toEqual(new Range([1, 0], [1, 4]));
                });
            });
        });
    });

    describe('valid file checks', () => {
        let editor;

        beforeEach(() => {
            waitsForPromise(() => {
                return atom.workspace.open(`${__dirname}/fixtures/valid.less`).then((openEditor) => {
                    editor = openEditor;
                });
            });
        });

        it('allows file without errors', () => {
            waitsForPromise(() => {
                return lint(editor).then((messages) => {
                    expect(messages.length).toEqual(0);
                });
            });
        });
    });

    describe('onlyWithRc setting', () => {
        let editor;

        beforeEach(() => {
            waitsForPromise(() => {
                atom.config.set('linter-lesshint.onlyWithRc', true);

                return atom.workspace.open(`${__dirname}/fixtures/invalid.less`).then((openEditor) => {
                    editor = openEditor;
                });
            });
        });

        it('should not check anything when "onlyWithRc" is true and no ".lesshintrc" is found', () => {
            waitsForPromise(() => {
                return lint(editor).then((messages) => {
                    expect(messages.length).toEqual(0);
                });
            });
        });
    });

    describe('globalConfig setting', () => {
        let editor;

        beforeEach(() => {
            atom.config.set('linter-lesshint.globalConfigDir', `${__dirname}/fixtures/lesshintrc`);
        });

        describe('valid file', () => {
            beforeEach(() => {
                waitsForPromise(() => {
                    return atom.workspace.open(`${__dirname}/fixtures/valid-global.less`).then((openEditor) => {
                        editor = openEditor;
                    });
                });
            });

            it('checks with global config when enabled', () => {
                atom.config.set('linter-lesshint.globalConfig', true);

                waitsForPromise(() => {
                    return lint(editor).then((messages) => {
                        expect(messages.length).toEqual(0);
                    });
                });
            });

            it('does not check with global config when disabled', () => {
                atom.config.set('linter-lesshint.globalConfig', false);

                waitsForPromise(() => {
                    return lint(editor).then((messages) => {
                        expect(messages.length).toEqual(1);
                    });
                });
            });
        });

        describe('invalid file', () => {
            beforeEach(() => {
                waitsForPromise(() => {
                    return atom.workspace.open(`${__dirname}/fixtures/invalid-global.less`).then((openEditor) => {
                        editor = openEditor;
                    });
                });
            });

            it('checks with global config when enabled', () => {
                atom.config.set('linter-lesshint.globalConfig', true);

                waitsForPromise(() => {
                    return lint(editor).then((messages) => {
                        expect(messages.length).toEqual(1);
                    });
                });
            });

            it('does not check with global config when disabled', () => {
                atom.config.set('linter-lesshint.globalConfig', false);

                waitsForPromise(() => {
                    return lint(editor).then((messages) => {
                        expect(messages.length).toEqual(0);
                    });
                });
            });
        });
    });
});
