import {Transformer} from '@parcel/plugin';
import ts from 'typescript';
import path from 'path';
import {generateDocgenCodeBlock} from 'react-docgen-typescript-plugin/dist/generateDocgenCodeBlock';
import {withCompilerOptions} from 'react-docgen-typescript';

let compilerOptions = {
  jsx: ts.JsxEmit.React,
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.Latest
};

let {fileNames, options: tsOptions} = getTSConfigFile('./tsconfig.json');
compilerOptions = {
  ...compilerOptions,
  ...tsOptions
};

let program = ts.createProgram(fileNames, compilerOptions);
let excludedProps = new Set([
  'id',
  'slot',
  'onCopy',
  'onCut',
  'onPaste',
  'onCompositionStart',
  'onCompositionEnd',
  'onCompositionUpdate',
  'onSelect',
  'onBeforeInput',
  'onInput',
  'onKeyDown',
  'onKeyUp',
  'onHoverStart',
  'onHoverEnd',
  'onHoverChange',
  'onFocus',
  'onBlur',
  'onFocusChange'
]);
let docGenParser = withCompilerOptions(compilerOptions, {
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  propFilter: (prop) => !prop.name.startsWith('aria-') && !excludedProps.has(prop.name)
});

export default new Transformer({
  async transform({asset}) {
    let docs = docGenParser.parseWithProgramProvider(asset.filePath, () => program);
    if (!docs.length) {
      return [asset];
    }

    for (let doc of docs) {
      doc.props = Object.fromEntries(Object.entries(doc.props).sort(([, a], [, b]) => {
        if (a.required !== b.required) {
          return a.required ? -1 : 1;
        }
        if (a.parent?.fileName.includes('node_modules') !== b.parent?.fileName.includes('node_modules')) {
          return a.parent?.fileName.includes('node_modules') ? 1 : -1;
        }
        if (/^on[A-Z]/.test(a.name) !== /^on[A-Z]/.test(b.name)) {
          return /^on[A-Z]/.test(a.name) ? 1 : -1;
        }
        return a.name.localeCompare(b.name);
      }));
    }
    
    let code = await asset.getCode();
    code = generateDocgenCodeBlock({
      filename: asset.filePath,
      source: code,
      componentDocs: docs,
      setDisplayName: true,
      typePropName: 'type',
      docgenCollectionName: 'STORYBOOK_REACT_CLASSES'
    });
    
    asset.setCode(code);
    return [asset];
  }
});

// Based on https://github.com/hipstersmoothie/react-docgen-typescript-plugin
// MIT license.
function getTSConfigFile(tsconfigPath: string): ts.ParsedCommandLine {
  try {
    const basePath = path.dirname(tsconfigPath);
    const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

    return ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      basePath,
      {},
      tsconfigPath
    );
  } catch (error) {
    return {} as ts.ParsedCommandLine;
  }
}