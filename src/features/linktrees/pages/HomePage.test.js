import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import * as routerModule from "../../../router";
import { linkTreesStore } from "../states/linkTreesStore";

describe("HomePage", () => {
  const mockProfile = { id: 1, name: "Abdullah", email: "abdul@del.org" };
  const mockLinkTrees = [
    {
      id: 1,
      user_id: 1,
      title: "Kursus Ku",
      type: "public",
      description: "Kumpulan kursus pertama",
      cover: "https://example.com/cover1.jpg",
      created_at: "2024-02-26T02:34:26.000000Z",
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: { name: "Abdullah Ubaid", photo: null },
      total_links: 3,
    },
    {
      id: 2,
      user_id: 2,
      title: "Referensi Kedua",
      type: "unlisted",
      description: "Deskripsi kedua",
      cover: null,
      created_at: "2024-02-26T02:34:26.000000Z",
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: null,
    },
    {
      id: 3,
      user_id: 1,
      title: "Rahasia Ketiga",
      type: "private",
      description: null,
      cover: "http://localhost:8000/",
      created_at: "2024-02-26T02:34:26.000000Z",
      updated_at: "2024-02-26T02:44:47.000000Z",
      author: { name: "Abdullah Ubaid" },
      total_links: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockImplementation(() => Promise.resolve());
  });

  it("should return null/empty if profile is not present", () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: { profile: null },
    });
    expect(wrapper.find('[data-testid="add-link-tree-btn"]').exists()).toBe(false);
  });

  it("should render header, stats and empty state when no link trees", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: [],
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain("Daftar Link Tree");
    expect(wrapper.text()).toContain("Belum ada data link tree yang cocok.");
    expect(wrapper.find('[data-testid="stat-total"]').text().trim()).toBe("0");
    expect(wrapper.find('[data-testid="stat-links"]').text().trim()).toBe("0");
  });

  it("should display loading indicator while loading link trees", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: [],
      },
    });

    vi.spyOn(linkTreesStore, "asyncSetLinkTrees").mockReturnValue(new Promise(() => {}));
    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");

    expect(wrapper.text()).toContain("Memuat daftar link tree...");
  });

  it("should render rows, author fallback, type badges, cover and stats", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain("Total Link Tree");
    expect(wrapper.text()).toContain("Kursus Ku");
    expect(wrapper.text()).toContain("Referensi Kedua");
    expect(wrapper.text()).toContain("Rahasia Ketiga");
    expect(wrapper.text()).toContain("Abdullah Ubaid");
    expect(wrapper.text()).toContain("Public");
    expect(wrapper.text()).toContain("Unlisted");
    expect(wrapper.text()).toContain("Private");

    expect(wrapper.find('[data-testid="stat-total"]').text().trim()).toBe("3");
    expect(wrapper.find('[data-testid="stat-public"]').text().trim()).toBe("1");
    expect(wrapper.find('[data-testid="stat-links"]').text().trim()).toBe("3");

    expect(wrapper.find('[data-testid="link-tree-row-1"] img').exists()).toBe(true);
    expect(wrapper.find('[data-testid="link-tree-row-2"] img').exists()).toBe(false);
    // cover berupa url kosong (berakhiran "/") tidak dianggap cover
    expect(wrapper.find('[data-testid="link-tree-row-3"] img').exists()).toBe(false);
  });

  it("should fall back to private style for unknown type", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: [{ id: 7, title: "Aneh", type: "weird", description: "x" }],
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.find('[data-testid="link-tree-row-7"]').text()).toContain("Private");
  });

  it("should search link trees by title and description", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const searchInput = wrapper.find('[data-testid="search-link-tree-input"]');

    await searchInput.setValue("Kursus");
    expect(wrapper.text()).toContain("Kursus Ku");
    expect(wrapper.text()).not.toContain("Referensi Kedua");

    await searchInput.setValue("kedua");
    expect(wrapper.text()).toContain("Referensi Kedua");
    expect(wrapper.text()).not.toContain("Kursus Ku");

    await searchInput.setValue("   ");
    expect(wrapper.text()).toContain("Kursus Ku");
    expect(wrapper.text()).toContain("Referensi Kedua");
  });

  it("should handle search against link trees with null title and description", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: [{ id: 99, title: null, description: null, type: "public" }],
      },
    });
    await new Promise((r) => setTimeout(r, 20));

    await wrapper.find('[data-testid="search-link-tree-input"]').setValue("xyz");
    expect(wrapper.text()).toContain("Belum ada data link tree yang cocok.");
  });

  it("should reload link trees with is_me filter when filter buttons clicked", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));
    const spy = linkTreesStore.asyncSetLinkTrees;
    spy.mockClear();

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith("1");

    await wrapper.find('[data-testid="filter-all-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith("");
  });

  it("should open and close AddModal when Tambah Link Tree button clicked", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    await wrapper.find('[data-testid="add-link-tree-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(true);

    await wrapper.find('[data-testid="close-add-modal-btn"]').trigger("click");
    expect(wrapper.find('[data-testid="add-link-tree-modal"]').exists()).toBe(false);
  });

  it("should navigate to detail page when view icon clicked", async () => {
    const navSpy = vi.spyOn(routerModule, "navigate").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    navSpy.mockClear();
    await new Promise((r) => setTimeout(r, 20));

    await wrapper.find('[data-testid="view-link-tree-1"]').trigger("click");

    expect(navSpy).toHaveBeenCalledWith("/link-trees/1");
  });

  it("should trigger confirm dialog and dispatch delete when delete icon confirmed", async () => {
    const { wrapper, linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const deleteSpy = vi
      .spyOn(store, "asyncSetIsLinkTreeDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: true });

    await wrapper.find('[data-testid="delete-link-tree-1"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(deleteSpy).toHaveBeenCalledWith(1);
  });

  it("should not dispatch delete when cancelled", async () => {
    const { wrapper, linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const deleteSpy = vi
      .spyOn(store, "asyncSetIsLinkTreeDelete")
      .mockReturnValue(Promise.resolve());
    vi.spyOn(toolsHelper, "showConfirmDialog").mockResolvedValue({ isConfirmed: false });

    await wrapper.find('[data-testid="delete-link-tree-1"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));

    expect(toolsHelper.showConfirmDialog).toHaveBeenCalled();
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("should dispatch delete all when confirmed and skip when cancelled", async () => {
    const { wrapper, linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const deleteAllSpy = vi
      .spyOn(store, "asyncSetIsLinkTreeDeleteAll")
      .mockReturnValue(Promise.resolve());
    const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

    confirmSpy.mockResolvedValue({ isConfirmed: false });
    await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(deleteAllSpy).not.toHaveBeenCalled();

    confirmSpy.mockResolvedValue({ isConfirmed: true });
    await wrapper.find('[data-testid="delete-all-btn"]').trigger("click");
    await new Promise((r) => setTimeout(r, 10));
    expect(deleteAllSpy).toHaveBeenCalledTimes(1);
  });

  it("should reload link trees when isLinkTreeDeleted is true", async () => {
    const { linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
        isLinkTreeDeleted: false,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const reloadSpy = vi
      .spyOn(store, "asyncSetLinkTrees")
      .mockReturnValue(Promise.resolve());

    store.setIsLinkTreeDeleted(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalled();
    expect(store.isLinkTreeDeleted).toBe(false);
  });

  it("should reload link trees when isLinkTreeDeletedAll is true", async () => {
    const { linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: mockLinkTrees,
        isLinkTreeDeletedAll: false,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    const reloadSpy = vi
      .spyOn(store, "asyncSetLinkTrees")
      .mockReturnValue(Promise.resolve());

    store.setIsLinkTreeDeletedAll(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(reloadSpy).toHaveBeenCalled();
    expect(store.isLinkTreeDeletedAll).toBe(false);
  });

  it("should not update loading state after unmount", async () => {
    let resolveLoad;
    const pendingPromise = new Promise((resolve) => {
      resolveLoad = resolve;
    });

    const { wrapper, linkTreesStore: store } = renderWithProviders(HomePage, {
      preloadedState: { profile: mockProfile, linkTrees: [] },
    });

    vi.spyOn(store, "asyncSetLinkTrees").mockReturnValue(pendingPromise);

    await wrapper.find('[data-testid="filter-mine-btn"]').trigger("click");

    wrapper.unmount();
    resolveLoad();
    await pendingPromise;
  });

  it("should handle null link trees store gracefully", async () => {
    const { wrapper } = renderWithProviders(HomePage, {
      preloadedState: {
        profile: mockProfile,
        linkTrees: null,
      },
    });

    await new Promise((r) => setTimeout(r, 20));

    expect(wrapper.text()).toContain("Belum ada data link tree");
  });
});
