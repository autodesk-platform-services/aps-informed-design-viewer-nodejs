const informedDesignApiUrl = "https://developer.api.autodesk.com/industrialized-construction/informed-design/v1/";

export const getReleaseById = async ({
  releaseId,
  accessId,
  accessType,
  accessToken
}) => {
  const queryParams = {
    accessType: accessType,
    accessId: accessId,
  };

  // Create a URL object
  const url = new URL(informedDesignApiUrl + "releases/" + releaseId);

  // Assign search parameters from an object
  url.search = new URLSearchParams(queryParams).toString();
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch release: ${response.statusText}`);
  }
  return response.json();
};

