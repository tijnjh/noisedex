import { Schema } from "effect";

// plain json from our own api and itunes, passed through as is: these types come from the sources'
// own typings, and describing every field again as a Schema would only drift from them
export const Json = <A>() => Schema.Any as unknown as Schema.Codec<A, A>;

export class ApiError extends Schema.TaggedError<ApiError>()("ApiError", {
  message: Schema.String,
}) {}
