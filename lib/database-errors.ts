const databaseUnavailableMessage = "We could not reach the product database. Please try again in a moment.";

export class CatalogDatabaseError extends Error {
  constructor() {
    super(databaseUnavailableMessage);
    this.name = "CatalogDatabaseError";
  }
}

export function isCatalogDatabaseError(error: unknown): error is CatalogDatabaseError {
  return error instanceof CatalogDatabaseError;
}

export function isDatabaseConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const text = `${error.name} ${error.message} ${error.stack ?? ""}`;
  return /EMAXCONNSESSION|DriverAdapterError|connection|timeout|ECONN|database/i.test(text);
}

function sanitizeErrorText(value: string) {
  const databaseUrl = process.env.DATABASE_URL;
  const withoutKnownSecret = databaseUrl ? value.split(databaseUrl).join("[DATABASE_URL]") : value;
  return withoutKnownSecret.replace(/postgres(?:ql)?:\/\/[^\s"')]+/gi, "[DATABASE_URL]");
}

export function logDatabaseError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(context, {
      name: sanitizeErrorText(error.name),
      message: sanitizeErrorText(error.message),
      stack: error.stack ? sanitizeErrorText(error.stack) : undefined
    });
    return;
  }

  console.error(context, { message: sanitizeErrorText(String(error)) });
}

export function publicErrorMessage(error: unknown, fallback: string) {
  if (isDatabaseConnectionError(error)) {
    return databaseUnavailableMessage;
  }
  return error instanceof Error ? error.message : fallback;
}

export function publicApiErrorMessage(context: string, error: unknown, fallback: string) {
  if (isDatabaseConnectionError(error)) {
    logDatabaseError(context, error);
    return databaseUnavailableMessage;
  }
  return error instanceof Error ? error.message : fallback;
}

export function databaseUnavailableCopy() {
  return databaseUnavailableMessage;
}
