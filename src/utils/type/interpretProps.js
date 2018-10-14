import { get, init, isString, last, walkReduceDepthFirst } from '@serverless/utils'
import hasVariableString from '../variable/hasVariableString'
import newVariable from '../variable/newVariable'
import isTypeConstruct from './isTypeConstruct'

const interpretProps = async (props, data, context) => {
  // NOTE BRN: This step walks depth first through the properties and creates instances for any property that has both a 'type' and 'inputs' combo. Lower level instances are created first so in case we have nested constructions the higher construction will receive an instance as an input instead of the { type, inputs }.

  // NOTE BRN: This step also converts variable strings into variable objects.

  // NOTE BRN: This step is done mutating the props object and its children.
  return walkReduceDepthFirst(
    async (accum, value, pathParts) => {
      const interpretedProps = await accum

      // TODO BRN: Break this up into something that is pluggable by core so that anyone can introduce new interpretable values.
      if (isString(value) && hasVariableString(value)) {
        const parentPathParts = init(pathParts)
        const lastPathPart = last(pathParts)
        const parent = get(parentPathParts, interpretedProps)
        parent[lastPathPart] = newVariable(value, data)
      } else if (isTypeConstruct(value)) {
        const parentPathParts = init(pathParts)
        const lastPathPart = last(pathParts)
        const parent = get(parentPathParts, interpretedProps)
        const { type, inputs } = value
        const Type = await context.loadType(type)
        parent[lastPathPart] = await context.construct(Type, inputs)
      }
      return interpretedProps
    },
    props,
    props
  )
}

export default interpretProps
