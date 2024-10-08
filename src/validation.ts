type Validator<T> = (input: unknown) => input is T;
type GetValidatedType<T extends Validator<unknown>> =
  T extends Validator<infer U> ? U : never;
type GenericObjectValidator = { [key: string]: Validator<unknown> };
type GetValidatedObjectType<T extends GenericObjectValidator> = {
  [key in keyof T]: GetValidatedType<T[key]>;
};

export const isNumber = (x: unknown): x is number => typeof x === "number";
export const isString = (x: unknown): x is string => typeof x === "string"; 
const isObjectType = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

export const isObject = <T extends GenericObjectValidator>(
  input: unknown,
  spec: T,
): input is GetValidatedObjectType<T> => {
  if (!isObjectType(input)) {
    return false;
  }
  for (const key of Object.keys(spec)) {
    if (!(key in input)) {
      return false;
    }
    const actual = input[key];
    const validator = spec[key];
    if (!validator(actual)) {
      return false;
    }
  }
  return true;
};

export const isArray = <T>(input: unknown, spec: Validator<T>): input is T[] =>
  Array.isArray(input) && input.every((x) => spec(x));
