import Joi from 'joi'

const matchesValidator = Joi.object({
  Blocker: Joi.number().min(0),
  Warning: Joi.number().min(0),
  ShouldBeFixed: Joi.number().min(0),
  Informational: Joi.number().min(0)
}).required()
export const schema = Joi.object({
  HasErrors: Joi.boolean().required(),
  FoundMatches: matchesValidator,
  ValidMatches: matchesValidator,
  CIUrl: Joi.string().uri().required().allow(null),
  TriggerSourceUrl: Joi.string().uri().required().allow(null),
  ScanResultUrl: Joi.string().uri().required().allow(null),
  SourceUrl: Joi.string().uri().required().allow(null),
  SourceID: Joi.string().required().allow(null),
  Scanner: Joi.object({
    Name: Joi.string().valid('KeyWord-Scanner').required(),
    LongName: Joi.string().pattern(new RegExp('KeyWord-Scanner$')).required(),
    Version: Joi.string().min(5).required(),
    InformationalVersion: Joi.string().required(),
    OSArch: Joi.string().required(),
    OSDescription: Joi.string().required(),
    ProcessArch: Joi.string().required(),
    Runtime: Joi.string().required(),
    FrameworkDescription: Joi.string().required()
  }),
  ScanRootPath: Joi.string().required(),
  ExcludedFolders: Joi.array().items(Joi.string()),
  Annotations: Joi.array().items(
    Joi.object({
      Path: Joi.string().required(),
      StartLine: Joi.number().required(),
      EndLine: Joi.number().required(),
      StartColumn: Joi.number().required(),
      EndColumn: Joi.number().required(),
      KeyWordSeverity: Joi.string().valid(
        'Blocker',
        'Warning',
        'ShouldBeFixed',
        'Informational'
      ),
      Message: Joi.string().required().allow('')
    })
  )
})
