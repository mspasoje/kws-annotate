import {resultFromJson} from '../src/create_annotations'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {expect, test} from '@jest/globals'

test('throws invalid json', async () => {
  const result_json = '\
    "Annotations": [{\
            "Path": "blah blah",\
            "Level": "error",\
            "StartLine": 20,\
            "EndLine": 20\
    }, {\
            "Path": "blah blah",\
            "Level": "warning",\
            "StartLine": 22,\
            "EndLine": 22\
    }]}';

  expect(() => resultFromJson(result_json)).toThrow('result_json is not json');
})

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_RESULT_JSON'] = '{\
      "Annotations": [{\
        "Path": "blah blah",\
        "Level": "error",\
        "StartLine": 20,\
        "EndLine": 20\
  }, {\
        "Path": "blah blah",\
        "Level": "warning",\
        "StartLine": 22,\
        "EndLine": 22\
  }]}';
  process.env['INPUT_OWNER'] = 'TEST_OWNER';
  process.env['INPUT_REPO'] = 'TEST_REPO';

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  expect(() => cp.execFileSync(np, [ip], options)).toThrowError();
})
