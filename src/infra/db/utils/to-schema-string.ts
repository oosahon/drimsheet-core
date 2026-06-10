interface IPayload {
  name: string;
  schema: string;
}

export default function toSchemaString(payload: IPayload) {
  return `"${payload.schema}"."${payload.name}"`;
}
