import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import linkTreeApi from "../api/linkTreeApi";

describe("ChangeModal", () => {
  const mockLinkTree = {
    id: 1,
    title: "Initial Title",
    type: "unlisted",
    description: "Initial Desc",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: false, linkTreeId: 1 },
    });
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
  });

  it("should show loader while fetching and populate inputs afterwards", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1 },
    });

    // belum selesai memuat: input belum tampil
    expect(wrapper.find('[data-testid="edit-link-tree-title-input"]').exists()).toBe(false);

    await new Promise((r) => setTimeout(r, 20));

    const titleInput = wrapper.find('[data-testid="edit-link-tree-title-input"]');
    const typeSelect = wrapper.find('[data-testid="edit-link-tree-type-select"]');
    const descInput = wrapper.find('[data-testid="edit-link-tree-description-input"]');

    expect(titleInput.element.value).toBe("Initial Title");
    expect(typeSelect.element.value).toBe("unlisted");
    expect(descInput.element.value).toBe("Initial Desc");

    await typeSelect.setValue("private");
    expect(typeSelect.element.value).toBe("private");
  });

  it("should handle error in loadLinkTreeData and call handleClose", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockRejectedValue(new Error("Fail"));
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});
    const closeSpy = vi.fn();

    renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(errorSpy).toHaveBeenCalledWith("Gagal mengambil data link tree");
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should fall back to defaults when link tree fields are empty", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({
      id: 1,
      title: null,
      type: null,
      description: null,
    });

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1 },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.find('[data-testid="edit-link-tree-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="edit-link-tree-type-select"]').element.value).toBe("public");
    expect(wrapper.find('[data-testid="edit-link-tree-description-input"]').element.value).toBe("");
  });

  it("should validate empty title and empty description", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1 },
    });

    await new Promise((r) => setTimeout(r, 20));

    const titleInput = wrapper.find('[data-testid="edit-link-tree-title-input"]');
    const form = wrapper.find("form");

    await titleInput.setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tidak boleh kosong");

    await titleInput.setValue("Valid Title");
    await wrapper.find('[data-testid="edit-link-tree-description-input"]').setValue("   ");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should dispatch asyncSetIsLinkTreeChange and close on success", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);
    const closeSpy = vi.fn();

    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
      preloadedState: {
        isLinkTreeChange: false,
        isLinkTreeChanged: false,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const changeSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeChange")
      .mockReturnValue(new Promise(() => {}));
    const reloadSpy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());

    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(1, "Initial Title", "unlisted", "Initial Desc");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeChange(true);
    linkTreesStore.setIsLinkTreeChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalledWith(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should handle isLinkTreeChange true when isLinkTreeChanged is false", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);

    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1 },
      preloadedState: {
        isLinkTreeChange: false,
        isLinkTreeChanged: false,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    linkTreesStore.setIsLinkTreeChange(true);
    linkTreesStore.setIsLinkTreeChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="edit-link-tree-title-input"]').exists()).toBe(true);
  });

  it("should trigger onClose on cancel or close button click", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);
    const closeSpy = vi.fn();

    const { wrapper } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
    });

    await new Promise((r) => setTimeout(r, 20));

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await wrapper.find('[data-testid="cancel-edit-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle null getLinkTreeById response and close without callback", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(null);

    const { wrapper, linkTreesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, linkTreeId: 1 },
      preloadedState: {
        isLinkTreeChange: false,
        isLinkTreeChanged: false,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");

    vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => Promise.resolve());
    linkTreesStore.setIsLinkTreeChange(true);
    linkTreesStore.setIsLinkTreeChanged(true);
    await new Promise((r) => setTimeout(r, 10));
    expect(wrapper.exists()).toBe(true);
  });
});
