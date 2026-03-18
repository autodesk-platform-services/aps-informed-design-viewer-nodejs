export function ensureStringQueryParam(name, value) {
    const trimmed = value?.trim();
    if (!trimmed || trimmed === "null" || trimmed === "undefined") {
      throw new Error(
        `${name} query parameter is required. Please check the URL and try again.`
      );
    }
    if (typeof value !== "string") {
      throw new Error(
        `${name} query parameter must be a string. Please check the URL and try again.`
      );
    }
    return trimmed;
  }
  
  export function ensureValidUuidQueryParam(name, value) {
    const trimmed = ensureStringQueryParam(name, value);
    if (
      !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        trimmed
      )
    ) {
      throw new Error(
        `${name} query parameter must be a valid UUID. Please check the URL and try again.`
      );
    }
    return trimmed;
  }