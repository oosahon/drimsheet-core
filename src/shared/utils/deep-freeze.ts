export default function deepFreeze<T extends object>(obj: T): Readonly<T> {
  Object.freeze(obj);

  Object.keys(obj).forEach((key) => {
    const prop = obj[key as keyof T];

    if (typeof prop === 'object' && prop !== null) {
      deepFreeze(prop);
    }
  });

  return obj;
}
