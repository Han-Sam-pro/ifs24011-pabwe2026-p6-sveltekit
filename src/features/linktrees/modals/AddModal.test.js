import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("AddModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: false },
    });
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(false);
  });

  it("should show validation error if title is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    await wrapper.find("form").trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");
  });

  it("should show validation error if description is empty", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    await wrapper.find('[data-testid="add-link-tree-title-input"]').setValue("Kursus Ku");
    await wrapper.find("form").trigger("submit");

    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should dispatch asyncSetIsLinkTreeAdd, show loading and call onClose on successful add", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
      preloadedState: {
        isLinkTreeAdd: false,
        isLinkTreeAdded: false,
      },
    });

    const asyncAddSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeAdd")
      .mockReturnValue(new Promise(() => {}));
    const reloadSpy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTrees")
      .mockImplementation(() => Promise.resolve());

    await wrapper.find('[data-testid="add-link-tree-title-input"]').setValue("  Kursus Ku  ");
    await wrapper.find('[data-testid="add-link-tree-type-select"]').setValue("unlisted");
    await wrapper
      .find('[data-testid="add-link-tree-description-input"]')
      .setValue("  Kumpulan kursus  ");

    await wrapper.find("form").trigger("submit");

    expect(asyncAddSpy).toHaveBeenCalledWith("Kursus Ku", "unlisted", "Kumpulan kursus");
    expect(wrapper.text()).toContain("Menyimpan...");

    // Simulate completion from store
    linkTreesStore.setIsLinkTreeAdd(true);
    linkTreesStore.setIsLinkTreeAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should handle isLinkTreeAdd true when isLinkTreeAdded is false", async () => {
    const { wrapper, linkTreesStore } = renderWithProviders(AddModal, {
      props: { show: true },
      preloadedState: {
        isLinkTreeAdd: false,
        isLinkTreeAdded: false,
      },
    });

    linkTreesStore.setIsLinkTreeAdd(true);
    linkTreesStore.setIsLinkTreeAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(true);
  });

  it("should close modal when close or cancel button clicked", async () => {
    const closeSpy = vi.fn();
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true, onClose: closeSpy },
    });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await wrapper.find('[data-testid="cancel-add-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle close without onClose callback", async () => {
    const { wrapper } = renderWithProviders(AddModal, {
      props: { show: true },
    });

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.exists()).toBe(true);
  });
});
