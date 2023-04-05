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

function resultFromJson(resultJson: string): ScanResult {
  try {
    return JSON.parse(resultJson);
  } catch (e) {
    throw new Error('result_json is not json')
  }
}

export async function createCheck(resultJson: string, checkName: string, checkTitle: string, owner: string, repo: string, authPAT: string) {
  const scanResult = resultFromJson(resultJson);
  let startIndex = 0;
  const jsonPayload = createJsonPayload(scanResult, checkName, checkTitle, startIndex, startIndex + 50);

  const octokit = new Octokit({
    auth: authPAT,
    userAgent: 'KWS Annotate GH Action v1',
    baseUrl: 'https://github.amd.com/api/v3'
  });
    
    
  const response = await octokit.rest.checks.create({
    owner: owner,
    repo: repo
    },
  );

  return response;
}