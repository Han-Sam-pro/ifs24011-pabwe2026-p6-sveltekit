import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLinkTreesStore, linkTreesStore } from "./linkTreesStore";
import linkTreeApi from "../api/linkTreeApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const FLAGS = [
  "isLinkTree",
  "isLinkTreeAdd",
  "isLinkTreeAdded",
  "isLinkTreeChange",
  "isLinkTreeChanged",
  "isLinkTreeChangeCover",
  "isLinkTreeChangedCover",
  "isLinkTreeDelete",
  "isLinkTreeDeleted",
  "isLinkTreeDeleteAll",
  "isLinkTreeDeletedAll",
  "isLinkTreeItemAdd",
  "isLinkTreeItemAdded",
  "isLinkTreeItemChange",
  "isLinkTreeItemChanged",
  "isLinkTreeItemDelete",
  "isLinkTreeItemDeleted",
];

describe("linkTreesStore", () => {
  beforeEach(() => {
    linkTreesStore.reset();
    vi.restoreAllMocks();
  });

  it("should have correct default state", () => {
    const store = useLinkTreesStore();
    expect(store.linkTrees).toEqual([]);
    expect(store.linkTree).toBeNull();
    FLAGS.forEach((flag) => {
      expect(store[flag]).toBe(false);
    });
    expect(store.$state.linkTrees).toEqual([]);
  });

  it("should update state with setters", () => {
    const store = useLinkTreesStore();
    store.setLinkTrees([{ id: 1 }]);
    expect(store.linkTrees).toEqual([{ id: 1 }]);

    store.setLinkTree({ id: 1 });
    expect(store.linkTree).toEqual({ id: 1 });

    FLAGS.forEach((flag) => {
      const setter = `set${flag.charAt(0).toUpperCase()}${flag.slice(1)}`;
      store[setter](true);
      expect(store[flag]).toBe(true);
    });
  });

  it("should reset state with custom values", () => {
    const store = useLinkTreesStore();
    store.reset({ linkTrees: [{ id: 5 }], isLinkTreeAdd: true });
    expect(store.linkTrees).toEqual([{ id: 5 }]);
    expect(store.isLinkTreeAdd).toBe(true);
    expect(store.isLinkTreeDelete).toBe(false);
  });

  describe("asyncSetLinkTrees", () => {
    it("should set link trees on success", async () => {
      const store = useLinkTreesStore();
      const spy = vi
        .spyOn(linkTreeApi, "getLinkTrees")
        .mockResolvedValue([{ id: 1 }]);

      await store.asyncSetLinkTrees("1");

      expect(spy).toHaveBeenCalledWith("1");
      expect(store.linkTrees).toEqual([{ id: 1 }]);
    });

    it("should use empty filter by default", async () => {
      const store = useLinkTreesStore();
      const spy = vi.spyOn(linkTreeApi, "getLinkTrees").mockResolvedValue([]);

      await store.asyncSetLinkTrees();

      expect(spy).toHaveBeenCalledWith("");
    });

    it("should set empty array on error", async () => {
      const store = useLinkTreesStore();
      store.setLinkTrees([{ id: 9 }]);
      vi.spyOn(linkTreeApi, "getLinkTrees").mockRejectedValue(new Error("Err"));

      await store.asyncSetLinkTrees();

      expect(store.linkTrees).toEqual([]);
    });
  });

  describe("asyncSetLinkTree", () => {
    it("should set link tree and setIsLinkTree on success", async () => {
      const store = useLinkTreesStore();
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockResolvedValue({ id: 1 });

      await store.asyncSetLinkTree(1);

      expect(store.linkTree).toEqual({ id: 1 });
      expect(store.isLinkTree).toBe(true);
    });

    it("should set null and setIsLinkTree on error", async () => {
      const store = useLinkTreesStore();
      vi.spyOn(linkTreeApi, "getLinkTreeById").mockRejectedValue(new Error("Err"));

      await store.asyncSetLinkTree(99);

      expect(store.linkTree).toBeNull();
      expect(store.isLinkTree).toBe(true);
    });
  });

  // [nama aksi store, metode API, argumen, kunci bendera selesai, kunci bendera hasil, pesan fallback]
  const mutations = [
    {
      name: "asyncSetIsLinkTreeAdd",
      api: "postLinkTree",
      args: ["Judul", "public", "Desc"],
      flag: "isLinkTreeAdd",
      done: "isLinkTreeAdded",
      fallback: "Link tree berhasil ditambahkan!",
      apiResult: { link_tree_id: 1 },
      expectedMessage: "Link tree berhasil ditambahkan!",
    },
    {
      name: "asyncSetIsLinkTreeChange",
      api: "putLinkTree",
      args: [1, "Judul", "private", "Desc"],
      flag: "isLinkTreeChange",
      done: "isLinkTreeChanged",
      fallback: "Link tree berhasil diperbarui!",
      apiResult: "Link tree diubah",
      expectedMessage: "Link tree diubah",
    },
    {
      name: "asyncSetIsLinkTreeChangeCover",
      api: "postLinkTreeCover",
      args: [1, new File([""], "cover.jpg")],
      flag: "isLinkTreeChangeCover",
      done: "isLinkTreeChangedCover",
      fallback: "Cover berhasil diperbarui!",
      apiResult: "Cover diubah",
      expectedMessage: "Cover diubah",
    },
    {
      name: "asyncSetIsLinkTreeDelete",
      api: "deleteLinkTree",
      args: [1],
      flag: "isLinkTreeDelete",
      done: "isLinkTreeDeleted",
      fallback: "Link tree berhasil dihapus!",
      apiResult: "Link tree dihapus",
      expectedMessage: "Link tree dihapus",
    },
    {
      name: "asyncSetIsLinkTreeDeleteAll",
      api: "deleteAllLinkTrees",
      args: [],
      flag: "isLinkTreeDeleteAll",
      done: "isLinkTreeDeletedAll",
      fallback: "Semua link tree berhasil dihapus!",
      apiResult: "Semua dihapus",
      expectedMessage: "Semua dihapus",
    },
    {
      name: "asyncSetIsLinkTreeItemAdd",
      api: "postLinkTreeItem",
      args: [1, "Delcom", "https://delcom.org"],
      flag: "isLinkTreeItemAdd",
      done: "isLinkTreeItemAdded",
      fallback: "Tautan berhasil ditambahkan!",
      apiResult: { item_id: 1 },
      expectedMessage: "Tautan berhasil ditambahkan!",
    },
    {
      name: "asyncSetIsLinkTreeItemChange",
      api: "putLinkTreeItem",
      args: [1, 2, "Delcom", "https://delcom.org"],
      flag: "isLinkTreeItemChange",
      done: "isLinkTreeItemChanged",
      fallback: "Tautan berhasil diperbarui!",
      apiResult: "Tautan diubah",
      expectedMessage: "Tautan diubah",
    },
    {
      name: "asyncSetIsLinkTreeItemDelete",
      api: "deleteLinkTreeItem",
      args: [1, 2],
      flag: "isLinkTreeItemDelete",
      done: "isLinkTreeItemDeleted",
      fallback: "Tautan berhasil dihapus!",
      apiResult: "Tautan dihapus",
      expectedMessage: "Tautan dihapus",
    },
  ];

  mutations.forEach((m) => {
    describe(m.name, () => {
      it("should call api, show success dialog, and set flags on success", async () => {
        const store = useLinkTreesStore();
        const apiSpy = vi.spyOn(linkTreeApi, m.api).mockResolvedValue(m.apiResult);
        const successSpy = vi
          .spyOn(toolsHelper, "showSuccessDialog")
          .mockImplementation(() => {});

        await store[m.name](...m.args);

        expect(apiSpy).toHaveBeenCalledWith(...m.args);
        expect(successSpy).toHaveBeenCalledWith(m.expectedMessage);
        expect(store[m.done]).toBe(true);
        expect(store[m.flag]).toBe(true);
      });

      it("should use fallback success message when api returns empty string", async () => {
        const store = useLinkTreesStore();
        vi.spyOn(linkTreeApi, m.api).mockResolvedValue("");
        const successSpy = vi
          .spyOn(toolsHelper, "showSuccessDialog")
          .mockImplementation(() => {});

        await store[m.name](...m.args);

        expect(successSpy).toHaveBeenCalledWith(m.fallback);
      });

      it("should show error dialog and set flags on failure", async () => {
        const store = useLinkTreesStore();
        store[`set${m.done.charAt(0).toUpperCase()}${m.done.slice(1)}`](true);
        vi.spyOn(linkTreeApi, m.api).mockRejectedValue(new Error("Gagal proses"));
        const errorSpy = vi
          .spyOn(toolsHelper, "showErrorDialog")
          .mockImplementation(() => {});

        await store[m.name](...m.args);

        expect(errorSpy).toHaveBeenCalledWith("Gagal proses");
        expect(store[m.done]).toBe(false);
        expect(store[m.flag]).toBe(true);
      });
    });
  });
});
