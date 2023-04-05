import * as core from '@actions/core'
import {createCheck} from './create_annotations'

async function run(): Promise<void> {
  try {
    core.debug('Somi car');
    const result_json: string = core.getInput('result_json');
    const owner: string = core.getInput('owner');
    const repo: string = core.getInput('repo');
    const checkName: string = core.getInput('name');
    const checkTitle: string = core.getInput('title');
    const pat: string = core.getInput('pat');
    const headSHA: string = core.getInput('head_sha')
    core.debug(`Received this json: ${result_json} ...`); // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

    core.debug(new Date().toTimeString());
    core.debug(headSHA);

    const response = await createCheck(result_json, checkName, checkTitle, owner, repo, pat, headSHA);

    core.debug(`${response.data}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run()
