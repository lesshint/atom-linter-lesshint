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

    describe('invalid files checks', () => {
        let editor;

        beforeEach(() => {
            waitsForPromise(() => {
                return atom.workspace.open(`${__dirname}/fixtures/invalid.less`).then((openEditor) => {
                    editor = openEditor;
                });
            });
        });

        it('fails file with errors', () => {
            const errorName = 'emptyRule';
            const errorMessage = "There shouldn't be any empty rules present.";

            lint(editor).then((messages) => {
                expect(messages[0].type).toBeDefined();
                expect(messages[0].type).toEqual('warning');
                expect(messages[0].html).toBeDefined();
                expect(messages[0].html).toEqual(`<span class='badge badge-flexible'>${errorName}</span> ${errorMessage}`);
                expect(messages[0].filePath).toBeDefined();
                expect(messages[0].filePath).toMatch(/.+invalid\.less$/);
                expect(messages[0].range).toBeDefined();
                expect(messages[0].range.length).toEqual(2);
                expect(messages[0].range).toEqual([[1, 0], [1, 4]]);
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
            lint(editor).then((messages) => {
                expect(messages.length).toEqual(0);
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
            lint(editor).then((messages) => {
                expect(messages.length).toEqual(0);
            });
        });
    });
});
