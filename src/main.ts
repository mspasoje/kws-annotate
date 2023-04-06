import * as core from '@actions/core'
import {createCheck} from './create_annotations'

async function run(): Promise<void> {
  try {
//    const result_json: string = core.getInput('result_json');
    const owner: string = core.getInput('owner');
    const repo: string = core.getInput('repo');
    const checkName: string = core.getInput('name');
    const checkTitle: string = core.getInput('title');
    const pat: string = core.getInput('pat');
    const headSHA: string = core.getInput('head_sha')

    var result_json: string = require('./output_file.json')
    core.debug(`Received this json: ${result_json} ...`); // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    const response = await createCheck(result_json, checkName, checkTitle, owner, repo, pat, headSHA);
    core.debug(`response: ${response}`);


  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run()
