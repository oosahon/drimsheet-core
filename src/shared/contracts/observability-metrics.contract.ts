type UMetricAttributeValue = string | number | boolean;

interface IMetricAttributes {
  readonly [name: string]: UMetricAttributeValue;
}

interface IIncrementMetricInput {
  name: string;
  description: string;
  unit: string;
  value: number;
  attributes: IMetricAttributes;
}

interface IObserveMetricInput {
  name: string;
  description: string;
  unit: string;
  value: number;
  attributes: IMetricAttributes;
}

interface ISetMetricInput {
  name: string;
  description: string;
  unit: string;
  value: number;
  attributes: IMetricAttributes;
}

export default interface IObservabilityMetrics {
  /** Best-effort recording operations must never throw to callers. */
  increment(input: IIncrementMetricInput): void;
  observe(input: IObserveMetricInput): void;
  set(input: ISetMetricInput): void;
}
