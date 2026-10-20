import { describe, it, expect, vi, beforeEach } from "vitest";
import ItemModal from "./ItemModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("ItemModal", () => {
  const mockItem = {
    id: 5,
    link_tree_id: 1,
    title: "Dasar Java",
    url: "https://youtu.be/uHyfQV0kbgo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: false, linkTreeId: 1 },
    });
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);
  });

  it("should render add mode with empty fields when item is null", () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: null },
    });

    expect(wrapper.text()).toContain("Tambah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("");
  });

  it("should render edit mode populated with item data", () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: mockItem },
    });

    expect(wrapper.text()).toContain("Ubah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Dasar Java");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe(
      "https://youtu.be/uHyfQV0kbgo"
    );
  });

  it("should fall back to empty strings when item title and url are empty", () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: { id: 9, title: null, url: null } },
    });

    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe("");
  });

  it("should validate title, url presence and url format", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: null },
    });
    const addSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemAdd")
      .mockReturnValue(new Promise(() => {}));

    const form = wrapper.find("form");
    const titleInput = wrapper.find('[data-testid="item-title-input"]');
    const urlInput = wrapper.find('[data-testid="item-url-input"]');

    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Judul tautan tidak boleh kosong");

    await titleInput.setValue("Judul");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("URL tidak boleh kosong");

    await urlInput.setValue("bukan-url");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith(
      "Format URL tidak valid (gunakan http:// atau https://)"
    );

    errorSpy.mockClear();
    await urlInput.setValue("ftp://contoh.com");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledTimes(1);

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should dispatch asyncSetIsLinkTreeItemAdd with http url and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: null, onClose: closeSpy },
      preloadedState: {
        isLinkTreeItemAdd: false,
        isLinkTreeItemAdded: false,
      },
    });

    const addSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemAdd")
      .mockReturnValue(new Promise(() => {}));
    const reloadSpy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());

    await wrapper.find('[data-testid="item-title-input"]').setValue("  Delcom  ");
    await wrapper.find('[data-testid="item-url-input"]').setValue(" http://delcom.org ");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(1, "Delcom", "http://delcom.org");
    expect(wrapper.text()).toContain("Menyimpan...");

    linkTreesStore.setIsLinkTreeItemAdd(true);
    linkTreesStore.setIsLinkTreeItemAdded(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalledWith(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should accept https url", async () => {
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: null },
    });
    const addSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemAdd")
      .mockReturnValue(new Promise(() => {}));

    await wrapper.find('[data-testid="item-title-input"]').setValue("Aman");
    await wrapper.find('[data-testid="item-url-input"]').setValue("https://delcom.org");
    await wrapper.find("form").trigger("submit");

    expect(addSpy).toHaveBeenCalledWith(1, "Aman", "https://delcom.org");
  });

  it("should handle isLinkTreeItemAdd true when isLinkTreeItemAdded is false", async () => {
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1 },
    });

    linkTreesStore.setIsLinkTreeItemAdd(true);
    linkTreesStore.setIsLinkTreeItemAdded(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(true);
  });

  it("should dispatch asyncSetIsLinkTreeItemChange in edit mode and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: mockItem, onClose: closeSpy },
      preloadedState: {
        isLinkTreeItemChange: false,
        isLinkTreeItemChanged: false,
      },
    });

    const changeSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemChange")
      .mockReturnValue(new Promise(() => {}));
    const reloadSpy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());

    await wrapper.find('[data-testid="item-title-input"]').setValue("Java Lanjut");
    await wrapper.find("form").trigger("submit");

    expect(changeSpy).toHaveBeenCalledWith(
      1,
      5,
      "Java Lanjut",
      "https://youtu.be/uHyfQV0kbgo"
    );

    linkTreesStore.setIsLinkTreeItemChange(true);
    linkTreesStore.setIsLinkTreeItemChanged(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalledWith(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should handle isLinkTreeItemChange true when isLinkTreeItemChanged is false", async () => {
    const { wrapper, linkTreesStore } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, item: mockItem },
    });

    linkTreesStore.setIsLinkTreeItemChange(true);
    linkTreesStore.setIsLinkTreeItemChanged(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(true);
  });

  it("should close modal when close or cancel button clicked", async () => {
    const closeSpy = vi.fn();
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1, onClose: closeSpy },
    });

    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(1);

    await wrapper.find('[data-testid="cancel-item-modal-btn"]').trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle close without onClose callback", async () => {
    const { wrapper } = renderWithProviders(ItemModal, {
      props: { show: true, linkTreeId: 1 },
    });

    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(wrapper.exists()).toBe(true);
  });
});
