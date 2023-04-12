/* eslint import/no-dynamic-require: 0 */
/* eslint @typescript-eslint/no-require-imports: 0 */
/* eslint @typescript-eslint/no-var-requires: 0 */
import * as core from '@actions/core'
import {Octokit} from '@octokit/rest'
import {LIB_VERSION} from './version'
import {schema} from './validations'

import {
  restEndpointMethods,
  RestEndpointMethodTypes // eslint-disable-line import/named
} from '@octokit/plugin-rest-endpoint-methods'

export const gitHubBaseURL = 'https://api.github.com'
type CreateCheckParameters =
  RestEndpointMethodTypes['checks']['create']['parameters']
type CreateCheckResponse =
  RestEndpointMethodTypes['checks']['create']['response']
type UpdateCheckParameters =
  RestEndpointMethodTypes['checks']['update']['parameters']
type UpdateCheckResponse =
  RestEndpointMethodTypes['checks']['update']['response']

type Annotation = {
  StartLine: number
  EndLine: number
  StartColumn: number
  EndColumn: number
  Path: string
  KeyWordSeverity: 'Warning' | 'Blocker' | 'ShouldBeFixed' | 'Informational'
  Message: string
}

type ValidMatches = {
  Blocker: number
  Warning: number
  ShouldBeFixed: number
  Informational: number
}

export type ScanResult = {
  ValidMatches: ValidMatches
  SourceId: string
  ScanStartTime: string
  ScanEndTime: string
  Annotations: Annotation[]
}

type ScanResultAnnotation = {
  path: string
  start_line: number
  end_line: number
  annotation_level: 'warning' | 'failure' | 'notice'
  message: string
}

type CheckOutput = {
  title: string
  summary: string
  annotations: ScanResultAnnotation[]
}

export function createOutputJson(
  resultJson: ScanResult,
  checkTitle: string,
  startIndex: number,
  endIndex: number
): CheckOutput {
  const mapped = resultJson.Annotations.slice(startIndex, endIndex).map(
    (annotation: Annotation) =>
      ({
        path: annotation.Path,
        start_line: annotation.StartLine,
        end_line: annotation.EndLine,
        annotation_level:
          annotation.KeyWordSeverity === 'Blocker'
            ? 'failure'
            : annotation.KeyWordSeverity === 'Informational'
            ? 'notice'
            : 'warning',
        message: annotation.Message
      } as ScanResultAnnotation)
  )

  return {
    title: checkTitle,
    summary: `There are ${resultJson.ValidMatches.Blocker} blockers, ${resultJson.ValidMatches.Warning} warnings, ${resultJson.ValidMatches.ShouldBeFixed} should be fixed and ${resultJson.ValidMatches.Informational} informational issues.`,
    annotations: mapped
  } as CheckOutput
}

export async function createCheck(
  outputFilePath: string,
  checkName: string,
  checkTitle: string,
  owner: string,
  repo: string,
  authPAT: string,
  headSHA: string
): Promise<number> {
  core.debug('createCheck')
  const result_json: ScanResult = require(outputFilePath)
  schema.validate(result_json)

  let startIndex = 0
  const indexStep = 1

  const MyOctokit = Octokit.plugin(restEndpointMethods)
  const octokit = new MyOctokit({
    auth: authPAT,
    userAgent: `KWS Annotate GH Action v${LIB_VERSION}`,
    baseUrl: gitHubBaseURL,
    log: console
  })

  core.debug(`octokit client:${octokit.rest}`)
  core.debug(`octokit client:${octokit.rest.checks}`)
  let generatedOutput = createOutputJson(
    result_json,
    checkTitle,
    startIndex,
    startIndex + indexStep
  )
  core.debug(
    `initial generatedOutput.annotations:${generatedOutput.annotations.length}`
  )

  const response: CreateCheckResponse = await octokit.rest.checks.create({
    owner,
    repo,
    name: checkName,
    head_sha: headSHA,
    status: 'completed',
    started_at: result_json.ScanStartTime,
    completed_at: result_json.ScanEndTime,
    conclusion: 'success',
    output: generatedOutput
  } as CreateCheckParameters)

  core.debug(`octokit client:${response.status}`)

  //  core.debug(`octokit client:${response.data}`);

  if (response.status === 201) {
    startIndex += indexStep
    generatedOutput = createOutputJson(
      result_json,
      checkTitle,
      startIndex,
      startIndex + indexStep
    )
    core.debug(
      `first generatedOutput.annotations:${generatedOutput.annotations.length}`
    )

    while (generatedOutput.annotations.length > 0) {
      const responseUpdate: UpdateCheckResponse =
        await octokit.rest.checks.update({
          owner,
          repo,
          check_run_id: response.data.id,
          name: checkName,
          output: generatedOutput
        } as UpdateCheckParameters)
      if (responseUpdate.status !== 200) {
        core.debug(`Failed to update annotations: ${responseUpdate.status}`)
        process.exit(1)
      }

      core.debug(`update response status: ${responseUpdate.status}`)
      startIndex += indexStep
      generatedOutput = createOutputJson(
        result_json,
        checkTitle,
        startIndex,
        startIndex + indexStep
      )
      core.debug(
        `loop generatedOutput.annotations:${generatedOutput.annotations.length}`
      )
    }
  }

  core.debug(`Create check completed`)

  return response.status
}
