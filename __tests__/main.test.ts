import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

test('throws invalid json file', async () => {
  expect(() => require('./test_output_invalid.json')).toThrow('Unexpected token : in JSON at position 18');
})

test('test runs', () => {
  process.env['INPUT_OWNER'] = 'TEST_OWNER';
  process.env['INPUT_REPO'] = 'TEST_REPO';
  process.env['INPUT_NAME'] = 'TEST_NAME';
  process.env['INPUT_TITLE'] = 'TEST_TITLE';
  process.env['INPUT_PAT'] = 'TEST_PAT';
  process.env['INPUT_HEAD_SHA'] = 'TEST_HEAD_SHA';
  process.env['INPUT_OUTPUT_FILE_PATH'] = './test_output.json';

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  expect(() => cp.execFileSync(np, [ip], options)).toThrowError();
})
