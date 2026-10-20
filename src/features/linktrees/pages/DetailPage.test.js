import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as router from "../../../router";
import { linkTreesStore } from "../states/linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";

describe("DetailPage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const mockLinkTree = {
    id: 1,
    user_id: 1,
    title: "Detail Link Tree Judul",
    type: "public",
    description: "Detail Link Tree Deskripsi",
    cover: "https://example.com/cover.jpg",
    created_at: "2024-02-26T02:34:26.000000Z",
    updated_at: "2024-02-26T02:44:47.000000Z",
    author: { name: "Abdullah Ubaid", photo: null },
    items: [
      { id: 11, link_tree_id: 1, title: "Dasar Java", url: "https://youtu.be/uHyfQV0kbgo" },
      { id: 12, link_tree_id: 1, title: "Dasar Svelte", url: "https://svelte.dev" },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(linkTreesStore, "asyncSetLinkTree").mockImplementation(() => Promise.resolve());
  });

  it("should render loading spinner if profile or link tree is missing", () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: null,
        linkTree: null,
      },
    });

    expect(wrapper.text()).not.toContain("Detail Link Tree Judul");

    const { wrapper: wrapper2 } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: null,
      },
    });
    expect(wrapper2.text()).not.toContain("Detail Link Tree Judul");
  });

  it("should not call asyncSetLinkTree if linkTreeId is not provided onMount", () => {
    const spy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());
    spy.mockClear();

    renderWithProviders(DetailPage, {
      props: { linkTreeId: null },
      preloadedState: {
        profile: mockProfile,
        linkTree: null,
      },
    });

    expect(spy).not.toHaveBeenCalled();
  });

  it("should call asyncSetLinkTree onMount when linkTreeId is provided", () => {
    const spy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());
    spy.mockClear();

    renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    expect(spy).toHaveBeenCalledWith(1);
  });

  it("should render link tree details, cover and items", () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    expect(wrapper.text()).toContain("Detail Link Tree Judul");
    expect(wrapper.text()).toContain("Detail Link Tree Deskripsi");
    expect(wrapper.text()).toContain("Abdullah Ubaid");
    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toContain("public");
    expect(wrapper.find("img").exists()).toBe(true);
    expect(wrapper.find('[data-testid="item-row-11"]').text()).toContain("Dasar Java");
    expect(wrapper.find('[data-testid="item-row-12"]').text()).toContain("https://svelte.dev");
    expect(wrapper.text()).toContain("2 tautan di halaman ini");
  });

  it("should support navigating back and opening/closing cover & edit modals", async () => {
    vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue(mockLinkTree);
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    const navigateSpy = vi.spyOn(router, "navigate").mockImplementation(() => {});
    await wrapper.find('[data-testid="back-to-link-trees-link"]').trigger("click");
    expect(navigateSpy).toHaveBeenCalledWith("/");

    await wrapper.find('[data-testid="edit-cover-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
    await wrapper.find('[data-testid="close-cover-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

    await wrapper.find('[data-testid="edit-detail-link-tree-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(true);
    await new Promise((r) => setTimeout(r, 20));
    await wrapper.find('[data-testid="close-edit-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="edit-link-tree-modal"]').exists()).toBe(false);
  });

  it("should render fallbacks when cover, description, author and items are missing", () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: {
          ...mockLinkTree,
          type: "weird",
          description: "",
          cover: "http://localhost:8000/",
          author: null,
          items: undefined,
        },
      },
    });

    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("Tidak ada deskripsi untuk link tree ini.");
    expect(wrapper.text()).toContain("Belum ada tautan");
    expect(wrapper.text()).toContain("0 tautan di halaman ini");
    expect(wrapper.find('[data-testid="detail-type-badge"]').text()).toContain("weird");
  });

  it("should open add item modal and close it", async () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="add-item-btn"]').trigger("click");

    const modal = wrapper.find('[data-testid="item-modal"]');
    expect(modal.exists()).toBe(true);
    expect(modal.text()).toContain("Tambah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("");

    await wrapper.find('[data-testid="close-item-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="item-modal"]').exists()).toBe(false);
  });

  it("should open edit item modal populated with selected item", async () => {
    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="edit-item-11"]').trigger("click");

    const modal = wrapper.find('[data-testid="item-modal"]');
    expect(modal.exists()).toBe(true);
    expect(modal.text()).toContain("Ubah Tautan");
    expect(wrapper.find('[data-testid="item-title-input"]').element.value).toBe("Dasar Java");
    expect(wrapper.find('[data-testid="item-url-input"]').element.value).toBe(
      "https://youtu.be/uHyfQV0kbgo"
    );
  });

  it("should dispatch item delete when confirmed", async () => {
    const deleteSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });

    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="delete-item-12"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(deleteSpy).toHaveBeenCalledWith(1, 12);
  });

  it("should not dispatch item delete when cancelled", async () => {
    const deleteSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeItemDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });

    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="delete-item-12"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(toolsHelper.showConfirmDialog).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should trigger confirm dialog and dispatch delete on delete button click when confirmed", async () => {
    const deleteSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });

    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="delete-detail-link-tree-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should not dispatch delete when cancelled", async () => {
    const deleteSpy = vi
      .spyOn(linkTreesStore, "asyncSetIsLinkTreeDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });

    const { wrapper } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await wrapper.find('[data-testid="delete-detail-link-tree-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(toolsHelper.showConfirmDialog).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should navigate back to home if isLinkTree is true and link tree is null", async () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockImplementation(() => {});
    const { linkTreesStore: store } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: null,
        isLinkTree: false,
      },
    });

    store.setIsLinkTree(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  it("should stay when isLinkTree is true and link tree exists", async () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockImplementation(() => {});
    const { wrapper, linkTreesStore: store } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
        isLinkTree: false,
      },
    });

    navigateSpy.mockClear();
    store.setIsLinkTree(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.text()).toContain("Detail Link Tree Judul");
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it("should navigate back to home if isLinkTreeDeleted is true", async () => {
    const navigateSpy = vi.spyOn(router, "navigate").mockImplementation(() => {});
    const { linkTreesStore: store } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
        isLinkTreeDeleted: false,
      },
    });

    store.setIsLinkTreeDeleted(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(navigateSpy).toHaveBeenCalledWith("/");
  });

  it("should reload link tree when isLinkTreeItemDeleted is true", async () => {
    const { linkTreesStore: store } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
        isLinkTreeItemDeleted: false,
      },
    });

    const reloadSpy = vi
      .spyOn(store, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());
    reloadSpy.mockClear();

    store.setIsLinkTreeItemDeleted(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalledWith(1);
    expect(store.isLinkTreeItemDeleted).toBe(false);
  });

  it("should trigger asyncSetLinkTree on linkTreeId change", async () => {
    const setSpy = vi
      .spyOn(linkTreesStore, "asyncSetLinkTree")
      .mockImplementation(() => Promise.resolve());
    const { rerender } = renderWithProviders(DetailPage, {
      props: { linkTreeId: 1 },
      preloadedState: {
        profile: mockProfile,
        linkTree: mockLinkTree,
      },
    });

    await rerender({ linkTreeId: 2 });
    await new Promise((r) => setTimeout(r, 10));

    expect(setSpy).toHaveBeenCalledWith(2);
  });
});
