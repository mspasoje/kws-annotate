import * as core from '@actions/core'
import {Octokit} from '@octokit/rest';

type ScanResultAnnotation = {
  Path: string;
  Level: string;
  StartLine: number;
  EndLine: number;
  RawDetails: string;
  Message: string;
  Title: string;
};

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
  Annotations: ScanResultAnnotation[];
};

type ScanResultAnnotation1 = {
  path: string;
  start_line: number;
  end_line: number;
  annotation_level: string;
  message: string;
};

type CheckOutput = {
  title: string;
  summary: string;
  annotations: ScanResultAnnotation1[];
};

export function createAnnotationsJson(resultJson: string, start_index: number, end_index: number): string {
  try {
    const result_obj: ScanResult = JSON.parse(resultJson);
    console.log(result_obj);
    const mapped = result_obj.Annotations.map((annotation: ScanResultAnnotation) => 
      `{\"path\":\"${annotation.Path}\",\"annotation_level\":\"${annotation.Level}\",\"start_line\":${annotation.StartLine},\"end_line\":${annotation.EndLine},` + 
      `\"raw_details\":\"${annotation.RawDetails??"Keyword found"}\",\"message\":\"${annotation.Message??"Please look for keywords"}\",` +
      `\"title\":\"${annotation.Title}\"}`
      );
    const annotations = mapped.reduce((previousValue: string, currentValue: string) => previousValue ? previousValue + "," + currentValue : currentValue, "");

    console.log(annotations);
    
    return annotations;
  } catch (e) {
    throw new Error('result_json is not json')
  }  
}

export function toPayloadAnnotations(annotations: ScanResultAnnotation[], start_index: number, end_index: number): string {
  if (!annotations) {
    return "";
  }
  core.debug(`So what are these annotations?:${annotations}`);

  const mapped = annotations.slice(start_index, end_index).map((annotation: ScanResultAnnotation) => 
    `{\"path\":\"${annotation.Path}\",\"annotation_level\":\"${annotation.Level}\",\"start_line\":${annotation.StartLine},\"end_line\":${annotation.EndLine},` + 
    `\"raw_details\":\"${annotation.RawDetails??"Keyword found"}\",\"message\":\"${annotation.Message??"Please look for keywords"}\",` +
    `\"title\":\"${annotation.Title}\"}`
    );
  const annotationsJsonString = mapped.reduce((previousValue: string, currentValue: string) => previousValue ? previousValue + "," + currentValue : currentValue, "");
  return annotationsJsonString;
}

export function createJsonPayload(resultJson: ScanResult, checkName: string, checkTitle: string, start_index: number, end_index: number): string {
  const payloadAnnotations = toPayloadAnnotations(resultJson.Annotations, start_index, end_index)

  if (!payloadAnnotations) {
    return "";
  }

  const jsonPayloadString = `{"name":"${checkName}","head_sha":"${resultJson.SourceId}","started_at":"${resultJson.ScanStartTime}","completed_at":"${resultJson.ScanEndTime}",` +
    `"status":"completed","conclusion":"success",` +
    `"output":{"title":"${checkTitle}","summary":"There are ${resultJson.ValidMatches.Blocker} blockers, ` + 
    `${resultJson.ValidMatches.Warning} warnings, ${resultJson.ValidMatches.ShouldBeFixed} should be fixed and ${resultJson.ValidMatches.Informational} informational issues.",` +
    `"text":"Please note that issues are highlighted only in files modified as part of this PR.","annotations":[${payloadAnnotations}]}}`;


    // '{"name":"mighty_readme","head_sha":"'"${GITHUB_SHA}"'","status":"completed","started_at":"2017-11-30T19:39:10Z","conclusion":"success","completed_at":"2017-11-30T19:49:10Z",
    //"output":{"title":"Mighty Readme report","summary":"There are 0 failures, 1 warnings, and 0 notices.",
    //          "text":"You may have some misspelled words on lines 2 and 4. You also may want to add a section in your README about how to install your app.",
    //            "annotations":[{"path":".github/workflows/test.yml","annotation_level":"warning","title":"Some Checker","message":"Check your stuff for stuff.","raw_details":"Do you mean?","start_line":2,"end_line":2}]}}'
    //       echo "$OWNER/$REPO and ${GITHUB_SHA}"
    //       echo 'xxx'"${GITHUB_SHA}"'xxx'
          
    //   - name: Annotate something more

  console.log(jsonPayloadString);

  return jsonPayloadString;
}

function createOutputJson(resultJson: ScanResult, checkName: string, checkTitle: string, start_index: number, end_index: number): CheckOutput {

  console.log(resultJson);
  const mapped = resultJson.Annotations.slice(start_index, end_index).map((annotation: ScanResultAnnotation) => <ScanResultAnnotation1>({path: annotation.Path,
    start_line: annotation.StartLine,
    end_line: annotation.EndLine,
    annotation_level: annotation.Level,
    message: annotation.Message
  }));

  return <CheckOutput>({
    title: checkTitle,
    summary: `There are ${resultJson.ValidMatches.Blocker} blockers, ${resultJson.ValidMatches.Warning} warnings, ${resultJson.ValidMatches.ShouldBeFixed} should be fixed and ${resultJson.ValidMatches.Informational} informational issues.`,
    //annotations: mapped
  })
}

function resultFromJson(resultJson: string): ScanResult {
  try {
    return JSON.parse(resultJson);
  } catch (e) {
    throw new Error('result_json is not json')
  }
}

export async function createCheck(resultJson: string, checkName: string, checkTitle: string, owner: string, repo: string, authPAT: string, headSHA: string) {
  core.debug("createCheck");
  const scanResult = resultFromJson(resultJson);
  core.debug("got scan result");
  core.debug(`scanResult:${scanResult}`);
  let startIndex = 0;
  const jsonPayload = createJsonPayload(scanResult, checkName, checkTitle, startIndex, startIndex + 50);

  core.debug(`jsonPayload:${jsonPayload}`);
  const octokit = new Octokit({
    auth: authPAT,
    userAgent: 'KWS Annotate GH Action v1',
    baseUrl: 'https://api.github.com',
    log: console
  });
    
  core.debug(`octokit client:${octokit.rest}`);
  core.debug(`octokit client:${octokit.rest.checks}`);
    
  const response = await octokit.rest.checks.create({
    owner: owner,
    repo: repo,
    name: checkName,
    head_sha: headSHA,
    output: {title: checkTitle, summary: "Not yet available"}
  });

  core.debug(`response:${response}`);
  core.debug(`response:${response.data}`);
  core.debug(`response:${response.data.id}`);

  const generatedOutput = createOutputJson(scanResult, checkName, checkTitle, startIndex, startIndex + 50);
  core.debug(`generatedOutput:${JSON.stringify(generatedOutput)}`);


  const getCheckRunResponse = await octokit.rest.checks.get({
    owner,
    repo,
    check_run_id: response.data.id,
  });
  core.debug(`getCheckRunResponse:${getCheckRunResponse.status}`);
  core.debug(`getCheckRunResponse:${JSON.stringify(getCheckRunResponse.data)}`);

  const updateResponse = await octokit.rest.checks.update({
    owner: owner,
    repo: repo,
    check_run_in: response.data.id,
    status: "queued",
    name: checkName,
//    summary: checkName,
    head_sha: headSHA,
//    output: generatedOutput
  });

  return response;
}