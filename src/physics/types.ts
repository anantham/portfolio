export interface Position {
  x: number
  y: number
}

export interface Velocity {
  x: number
  y: number
}

export interface MotionEnvironment {
  width: number
  height: number
  time: number
  deltaTime: number
  mouse?: Position | null
  mouseVelocity?: Velocity | null
}

export interface StrategyUpdateResult {
  position: Position
  velocity: Velocity
  heading?: number
  meta?: Record<string, unknown>
}

export interface StrategyRunner {
  step: (env: MotionEnvironment) => StrategyUpdateResult
  reset: (env: MotionEnvironment) => void
}

export interface StrategyFactory<TConfig = Record<string, unknown>> {
  (config: TConfig, options: { seed?: number }): StrategyRunner
}
