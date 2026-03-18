import { initViewer, loadModel } from "./viewer.js";
import {
  releaseIdQueryParam,
  accessIdQueryParam,
  accessTypeQueryParam,
} from "./constants.js";
import { ensureStringQueryParam, ensureValidUuidQueryParam } from "./utils.js";
import { getReleaseById } from "./informed-design-api.js";

const PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY = "productReleaseData";

function parseProductReleaseFromUrl(location) {
  const params = new URLSearchParams(location.search || "");

  return {
    releaseId: params.get(releaseIdQueryParam),
    accessId: params.get(accessIdQueryParam),
    accessType: params.get(accessTypeQueryParam),
  };
}

function buildUrlWithProductReleaseData(productReleaseData) {
  const url = new URL(window.location.href);
  url.searchParams.set(releaseIdQueryParam, productReleaseData.releaseId);
  url.searchParams.set(accessIdQueryParam, productReleaseData.accessId);
  url.searchParams.set(accessTypeQueryParam, productReleaseData.accessType);
  return url.toString();
}

function validateUserProvidedProductReleaseData(productReleaseData) {
  ensureValidUuidQueryParam(releaseIdQueryParam, productReleaseData.releaseId);
  ensureStringQueryParam(accessIdQueryParam, productReleaseData.accessId);
  ensureStringQueryParam(accessTypeQueryParam, productReleaseData.accessType);
}

async function saveProductReleaseDataToLocalStorage(productReleaseData) {
  localStorage.setItem(
    PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY,
    JSON.stringify(productReleaseData)
  );
}

function getProductReleaseDataFromLocalStorage() {
  const productReleaseData = JSON.parse(
    localStorage.getItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY)
  );
  return productReleaseData;
}

function removeProductReleaseDataFromLocalStorage() {
  localStorage.removeItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY);
}

function savePreLoginState() {
  const productReleaseData = parseProductReleaseFromUrl(window.location);
  // Only save if there is product release data in the URL
  if (productReleaseData) {
    saveProductReleaseDataToLocalStorage(productReleaseData);
  }
}

function cleanup(event) {
  window.removeEventListener("beforeunload", beforeUnloadCleanup);

  const iframe = document.createElement("iframe");
  iframe.style.visibility = "hidden";
  iframe.src = "https://accounts.autodesk.com/Authentication/LogOut";
  document.body.appendChild(iframe);
  iframe.onload = () => {
    window.location.replace("/api/auth/logout");
    document.body.removeChild(iframe);
  };
}

function beforeUnloadCleanup(event) {
  cleanup(event);
}

function setupCleanup() {
  window.addEventListener("beforeunload", beforeUnloadCleanup);
}

async function loadProductReleaseIntoViewer({
  releaseId,
  accessId,
  accessType,
  accessToken,
}) {
  try {
    if (!releaseId || !accessId || !accessType) {
      alert("Product release data is incomplete. Please try again.");
      return;
    }

    const release = await getReleaseById({
      releaseId,
      accessId,
      accessType,
      accessToken,
    });

    const viewer = await initViewer(document.getElementById("preview"));

    const extension = await viewer.getExtensionAsync("Autodesk.InformedDesign");

    await loadModel(extension, {
      releaseId: release.id,
      accessId: release.accessId,
      accessType: release.accessType,
      productId: release.productId,
    });
  } catch (err) {
    alert("Could not initialize viewer. See the console for more details.");
    console.error(err);
  }
}

async function initApp() {
  try {
    const resp = await fetch("/api/auth/profile");
    if (resp.ok) {
      setupCleanup();
      const tokenResponse = await fetch("/api/auth/token");
      const { access_token } = await tokenResponse.json();

      // If there is product release data in the URL,
      // use it as it takes precedence over the local storage data.
      const productReleaseDataFromUrl = parseProductReleaseFromUrl(
        window.location
      );
      if (
        productReleaseDataFromUrl &&
        productReleaseDataFromUrl.releaseId &&
        productReleaseDataFromUrl.accessId &&
        productReleaseDataFromUrl.accessType
      ) {
        validateUserProvidedProductReleaseData(productReleaseDataFromUrl);
        // Save the product release data to local storage
        // in case the user reloads the page
        // so the data is available the next time the app loads
        saveProductReleaseDataToLocalStorage({
          releaseId: productReleaseDataFromUrl.releaseId,
          accessId: productReleaseDataFromUrl.accessId,
          accessType: productReleaseDataFromUrl.accessType,
        });
      }

      const productReleaseDataFromLocalStorage =
        getProductReleaseDataFromLocalStorage();
      validateUserProvidedProductReleaseData(
        productReleaseDataFromLocalStorage
      );
      // Replace the current URL with the product release data, so the viewer model is consistent
      // with the URL that was used to login.
      const url = buildUrlWithProductReleaseData(
        productReleaseDataFromLocalStorage
      );
      window.history.replaceState({}, "", url);
      loadProductReleaseIntoViewer({
        releaseId: productReleaseDataFromLocalStorage.releaseId,
        accessId: productReleaseDataFromLocalStorage.accessId,
        accessType: productReleaseDataFromLocalStorage.accessType,
        accessToken: access_token,
      });
    } else {
      savePreLoginState();

      window.location.replace("/api/auth/login");
    }
  } catch (err) {
    alert(
      "Could not initialize the application. See console for more details."
    );
    console.error(err);
  }
}

initApp();
