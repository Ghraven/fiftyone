/**
 * Copyright 2017-2026, Voxel51, Inc.
 *
 * Regressions related to the "Pixelating..." loading screen
 */
import { test as base } from "src/oss/fixtures";
import { GridPom } from "src/oss/poms/grid";
import { ModalPom } from "src/oss/poms/modal";
import { PagePom } from "src/oss/poms/page";
import { getUniqueDatasetNameWithPrefix } from "src/oss/utils";

const datasetName = getUniqueDatasetNameWithPrefix("loading-screen");

const test = base.extend<{
  grid: GridPom;
  modal: ModalPom;
  pagePom: PagePom;
}>({
  grid: async ({ page, eventUtils }, use) => {
    await use(new GridPom(page, eventUtils));
  },
  modal: async ({ page, eventUtils }, use) => {
    await use(new ModalPom(page, eventUtils));
  },
  pagePom: async ({ page, eventUtils }, use) => {
    await use(new PagePom(page, eventUtils));
  },
});

test.afterAll(async ({ foWebServer }) => {
  await foWebServer.stopWebServer();
});

test.beforeAll(async ({ datasetFactory, foWebServer }) => {
  await foWebServer.startWebServer();
  await datasetFactory.createBlankDataset({
    datasetName,
    numSamples: 2,
  });
});

test.describe.serial("loading screen", () => {
  /**
   * Opens the first sample, then asserts that only the initial loading screen
   * is shown and opening the modal does not reveal itself again via React's Suspense
   */
  test("does not show when opening the modal", async ({
    fiftyoneLoader,
    grid,
    modal,
    page,
    pagePom,
  }) => {
    await fiftyoneLoader.waitUntilGridVisible(page, datasetName);
    await pagePom.assert.verifyLoadingScreenCount(1);
    await grid.openFirstSample();
    await modal.waitForSampleLoadDomAttribute();
    await pagePom.assert.verifyLoadingScreenCount(1);
  });

  /**
   * Navigates to a known sample by ID, opens the modal, then navigates forward
   * and backward, asserting after each step that exactly one loading screen
   * element exists in the DOM.
   */
  test("does not show when navigating between samples", async ({
    fiftyoneLoader,
    grid,
    modal,
    page,
    pagePom,
  }) => {
    await fiftyoneLoader.waitUntilGridVisible(page, datasetName, {
      searchParams: new URLSearchParams({ id: "000000000000000000000000" }),
    });
    await pagePom.assert.verifyLoadingScreenCount(1);
    await grid.openFirstSample();
    await modal.waitForSampleLoadDomAttribute();

    await modal.navigateNextSample();
    await pagePom.assert.verifyLoadingScreenCount(1);

    await modal.navigatePreviousSample();
    await pagePom.assert.verifyLoadingScreenCount(1);
  });
});
