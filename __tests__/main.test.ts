import {expect, test} from '@jest/globals'
import {ScanResult, createOutputJson} from '../src/create_annotations'

test('throws invalid json file', async () => {
  expect(() => require('./test_output_invalid.json')).toThrow('Unexpected token : in JSON at position 18');
})

test('generates proper annotation for input file and request', async () => {
  var result_json: ScanResult = require('./test_output.json');

  expect(createOutputJson(result_json, 'checkTitle', 0, 50).annotations.length).toBe(2);
  expect(createOutputJson(result_json, 'checkTitle', 0, 1).annotations.length).toBe(1);
  expect(createOutputJson(result_json, 'checkTitle', 0, 0).annotations.length).toBe(0);
  expect(createOutputJson(result_json, 'checkTitle', 1, 1).annotations.length).toBe(0);
  expect(createOutputJson(result_json, 'checkTitle', 1, 2).annotations.length).toBe(1);
  expect(createOutputJson(result_json, 'checkTitle', 2, 3).annotations.length).toBe(0);
})
