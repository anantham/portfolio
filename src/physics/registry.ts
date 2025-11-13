import type { StrategyFactory } from './types'
import { createZenStrategy } from './strategies/zen'
import { createFlowFieldStrategy } from './strategies/flowField'

export const strategyRegistry: Record<string, StrategyFactory<any>> = {
  zen: createZenStrategy,
  'flow-field': createFlowFieldStrategy
}

export function getStrategyFactory(type: string): StrategyFactory<any> | undefined {
  return strategyRegistry[type]
}
