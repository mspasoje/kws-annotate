import * as core from '@actions/core'
import {createCheck} from './create_annotations'

async function run(): Promise<void> {
  try {
    const owner: string = core.getInput('owner');
    const repo: string = core.getInput('repo');
    const checkName: string = core.getInput('name');
    const checkTitle: string = core.getInput('title');
    const pat: string = core.getInput('pat');
    const headSHA: string = core.getInput('head_sha');
    const outputFilePath: string = core.getInput('output_file_path');

    core.debug(`input arg owner: ${owner}`);
    core.debug(`input arg repo: ${repo}`);
    core.debug(`input arg checkName: ${checkName}`);
    core.debug(`input arg checkTitle: ${checkTitle}`);
    core.debug(`input arg pat: ${pat}`);
    core.debug(`input arg headSHA: ${headSHA}`);
    core.debug(`input arg headSHA: ${headSHA}`);
    const response = await createCheck(outputFilePath, checkName, checkTitle, owner, repo, pat, headSHA);

    core.debug(`response: ${response}`);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

run()
