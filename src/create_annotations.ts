import * as core from '@actions/core'
import {Octokit} from '@octokit/rest';

type ScanMatch = {
  StartLine: number;
  EndLine: number;
  StartColumn: number;
  EndColumn: number;
  Path: string;
  KeyWordSeverity: "Warning" | "Blocker" | "ShouldBeFixed" | "Informational";
  Message: string;
}

type ValidMatches = {
  Blocker: number;
  Warning: number;
  ShouldBeFixed: number;
  Informational: number;
};

type ScanResult = {
  ValidMatches: ValidMatches;
  SourceId: string;
  ScanStartTime: string;
  ScanEndTime: string;
  ScanMatches: ScanMatch[];
};

type ScanResultAnnotation = {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: "warning" | "failure" | "notice";
  message: string;
};

type CheckOutput = {
  title: string;
  summary: string;
  annotations: ScanResultAnnotation[];
};

function createOutputJson(resultJson: ScanResult, checkTitle: string, start_index: number, end_index: number): CheckOutput {

  console.log(resultJson);
  const mapped = resultJson.ScanMatches.slice(start_index, end_index).map((annotation: ScanMatch) => <ScanResultAnnotation>({path: annotation.Path,
    start_line: annotation.StartLine,
    end_line: annotation.EndLine,
    annotation_level: annotation.KeyWordSeverity === "Blocker" ? "failure" : (annotation.KeyWordSeverity === "Informational" ? "notice" : "warning"),
    message: annotation.Message
  }));

  return <CheckOutput>({
    title: checkTitle,
    summary: `There are ${resultJson.ValidMatches.Blocker} blockers, ${resultJson.ValidMatches.Warning} warnings, ${resultJson.ValidMatches.ShouldBeFixed} should be fixed and ${resultJson.ValidMatches.Informational} informational issues.`,
    annotations: mapped
  })
}

export async function createCheck(output_file_path: string, checkName: string, checkTitle: string, owner: string, repo: string, authPAT: string, headSHA: string) {
  core.debug("createCheck");
  var result_json: ScanResult = require(output_file_path);

  let startIndex = 0;
  const indexStep = 50;

  const octokit = new Octokit({
    auth: authPAT,
    userAgent: 'KWS Annotate GH Action v1',
    baseUrl: 'https://api.github.com',
    log: console
  });
    
  core.debug(`octokit client:${octokit.rest}`);
  core.debug(`octokit client:${octokit.rest.checks}`);
  let generatedOutput = createOutputJson(result_json, checkTitle, startIndex, startIndex + indexStep);
    
  const response = await octokit.rest.checks.create({
    owner: owner,
    repo: repo,
    name: checkName,
    head_sha: headSHA,
    status: 'completed',
    conclusion: 'success',
    output: generatedOutput
  });

  // const getCheckRunResponse = await octokit.rest.checks.get({
  //   owner,
  //   repo,
  //   check_run_id: response.data.id,
  // });

  // const updateResponse = await octokit.rest.checks.update({
  //   owner: owner,
  //   repo: repo,
  //   check_run_in: response.data.id,
  //   output: generatedOutput
  // });
  startIndex += indexStep;
  generatedOutput = createOutputJson(result_json, checkTitle, startIndex, startIndex + indexStep);
  while (generatedOutput.annotations.length > 0) {
    await octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
      owner: owner,
      repo: repo,
      check_run_id: response.data.id,
      name: checkName,
      output: generatedOutput,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })
    startIndex += indexStep;
    generatedOutput = createOutputJson(result_json, checkTitle, startIndex, startIndex + indexStep);
  }

  core.debug(`Create check completed`);

  return response;
}