async function getAccessToken(callback) {
  try {
    const resp = await fetch("/api/auth/token");
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
    const { access_token, expires_in } = await resp.json();
    callback(access_token, expires_in);
  } catch (err) {
    alert("Could not obtain access token. See the console for more details.");
    console.error(err);
  }
}

export function initViewer(container) {
  return new Promise(function (resolve, reject) {
    Autodesk.Viewing.Initializer(
      { env: "AutodeskProduction", getAccessToken },
      function () {
        const config = {
          extensions: ["Autodesk.InformedDesign"],
        };
        const viewer = new Autodesk.Viewing.GuiViewer3D(container, config);
        const startedCode = viewer.start();
        if (startedCode > 0) {
          reject(
            new Error(
              "Failed to create a Viewer: WebGL not supported or init error."
            )
          );
          return;
        }
        viewer.setTheme("light-theme");
        viewer
          .getExtensionAsync("Autodesk.InformedDesign")
          .then((extension) => extension.setTheme("light-theme"))
          .catch((error) => {
            console.error(
              "Failed to set Informed Design extension theme:",
              error
            );
          });
        resolve(viewer);
      }
    );
  });
}

export async function loadModel(extension, { releaseId, accessId, accessType, productId, variantId, representation }) {
  try {
    // The extension resolves which variant/representation to load from the
    // initialVariantId/initialRepresentation fields on the product release data.
    // When initialVariantId is omitted it falls back to the default (latest) variant.
    extension.setProductReleaseDataToFetch({
      releaseId,
      accessId,
      accessType,
      productId,
      initialVariantId: variantId,
      initialRepresentation: representation,
    });
    extension.fetchProductRelease();
    extension.loadProductReleaseDefaultVariantSVF();
  } catch (error) {
    alert("Could not load model. See the console for more details.");
    console.error(error);
  }
}
