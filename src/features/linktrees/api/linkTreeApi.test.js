import { describe, it, expect, vi, beforeEach } from "vitest";
import linkTreeApi from "./linkTreeApi";
import apiHelper from "../../../helpers/apiHelper";

const mockResponse = (body) => ({ json: async () => body });

describe("linkTreeApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postLinkTree", () => {
    it("should create new link tree and return data", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", data: { link_tree_id: 10 } })
        );

      const res = await linkTreeApi.postLinkTree("Judul", "public", "Deskripsi");

      expect(res).toEqual({ link_tree_id: 10 });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            title: "Judul",
            type: "public",
            description: "Deskripsi",
          }),
        })
      );
    });

    it("should throw error if creation fails", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Data tidak valid" })
      );

      await expect(linkTreeApi.postLinkTree("", "", "")).rejects.toThrow(
        "Data tidak valid"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.postLinkTree("", "", "")).rejects.toThrow(
        "Gagal menambahkan link tree"
      );
    });

    it("should not throw when result.success flag is truthy", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ success: true, data: { link_tree_id: 3 } })
      );

      const res = await linkTreeApi.postLinkTree("A", "private", "B");
      expect(res).toEqual({ link_tree_id: 3 });
    });
  });

  describe("postLinkTreeCover", () => {
    it("should upload cover with FormData and return message on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", message: "Berhasil mengubah cover" })
        );

      const dummyFile = new File(["dummy"], "cover.jpg", { type: "image/jpeg" });
      const msg = await linkTreeApi.postLinkTreeCover(1, dummyFile);

      expect(msg).toBe("Berhasil mengubah cover");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1/cover"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("should handle cover file without name property properly", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "success", message: "Berhasil" })
      );

      const dummyBlob = new Blob(["dummy"], { type: "image/jpeg" });
      const msg = await linkTreeApi.postLinkTreeCover(1, dummyBlob);
      expect(msg).toBe("Berhasil");
    });

    it("should throw error on upload cover fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Format tidak didukung" })
      );

      const dummyFile = new File(["dummy"], "cover.jpg");
      await expect(
        linkTreeApi.postLinkTreeCover(1, dummyFile)
      ).rejects.toThrow("Format tidak didukung");
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      const dummyFile = new File(["dummy"], "cover.jpg");
      await expect(
        linkTreeApi.postLinkTreeCover(1, dummyFile)
      ).rejects.toThrow("Gagal mengubah cover");
    });
  });

  describe("putLinkTree", () => {
    it("should update link tree and return message on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", message: "Berhasil mengubah data" })
        );

      const msg = await linkTreeApi.putLinkTree(1, "Updated", "unlisted", "Desc");

      expect(msg).toBe("Berhasil mengubah data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({
            title: "Updated",
            type: "unlisted",
            description: "Desc",
          }),
        })
      );
    });

    it("should throw error on update failure", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Gagal update" })
      );

      await expect(linkTreeApi.putLinkTree(1, "", "", "")).rejects.toThrow(
        "Gagal update"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.putLinkTree(1, "", "", "")).rejects.toThrow(
        "Gagal mengubah link tree"
      );
    });
  });

  describe("getLinkTrees", () => {
    it("should fetch all link trees without filter", async () => {
      const mockData = [{ id: 1, title: "Tree 1" }];
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", data: { link_trees: mockData } })
        );

      const trees = await linkTreeApi.getLinkTrees();

      expect(trees).toEqual(mockData);
      expect(spy.mock.calls[0][0]).not.toContain("is_me");
    });

    it("should fetch own link trees when is_me parameter provided", async () => {
      const mockData = [{ id: 2, title: "Tree 2" }];
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", data: { link_trees: mockData } })
        );

      const trees = await linkTreeApi.getLinkTrees("1");

      expect(trees).toEqual(mockData);
      expect(spy.mock.calls[0][0]).toContain("?is_me=1");
    });

    it("should treat null and undefined filters as no filter", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", data: { link_trees: [] } })
        );

      await linkTreeApi.getLinkTrees(null);
      await linkTreeApi.getLinkTrees(undefined);

      expect(spy.mock.calls[0][0]).not.toContain("is_me");
      expect(spy.mock.calls[1][0]).not.toContain("is_me");
    });

    it("should return empty array if data.link_trees is missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "success", data: {} })
      );

      expect(await linkTreeApi.getLinkTrees()).toEqual([]);
    });

    it("should return empty array if data is missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "success" })
      );

      expect(await linkTreeApi.getLinkTrees()).toEqual([]);
    });

    it("should throw error on fetch link trees fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Akses tidak diizinkan" })
      );

      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow(
        "Akses tidak diizinkan"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.getLinkTrees()).rejects.toThrow(
        "Gagal mengambil data link tree"
      );
    });
  });

  describe("getLinkTreeById", () => {
    it("should return single link tree object on success", async () => {
      const mockData = { id: 5, title: "Single", items: [] };
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "success", data: { link_tree: mockData } })
      );

      expect(await linkTreeApi.getLinkTreeById(5)).toEqual(mockData);
    });

    it("should return undefined when data is missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "success" })
      );

      expect(await linkTreeApi.getLinkTreeById(5)).toBeUndefined();
    });

    it("should throw error on detail fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Link tree tidak ditemukan" })
      );

      await expect(linkTreeApi.getLinkTreeById(999)).rejects.toThrow(
        "Link tree tidak ditemukan"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.getLinkTreeById(999)).rejects.toThrow(
        "Gagal mengambil detail link tree"
      );
    });
  });

  describe("deleteLinkTree", () => {
    it("should delete link tree and return message on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", message: "Berhasil menghapus data" })
        );

      const msg = await linkTreeApi.deleteLinkTree(1);

      expect(msg).toBe("Berhasil menghapus data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error on delete fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Gagal menghapus" })
      );

      await expect(linkTreeApi.deleteLinkTree(1)).rejects.toThrow(
        "Gagal menghapus"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.deleteLinkTree(1)).rejects.toThrow(
        "Gagal menghapus link tree"
      );
    });
  });

  describe("deleteAllLinkTrees", () => {
    it("should delete all link trees and return message on success", async () => {
      const spy = vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({
          status: "success",
          message: "Berhasil menghapus semua data link tree",
        })
      );

      const msg = await linkTreeApi.deleteAllLinkTrees();

      expect(msg).toBe("Berhasil menghapus semua data link tree");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error on delete all fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Unauthenticated." })
      );

      await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow(
        "Unauthenticated."
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.deleteAllLinkTrees()).rejects.toThrow(
        "Gagal menghapus semua link tree"
      );
    });
  });

  describe("postLinkTreeItem", () => {
    it("should add item and return data on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", data: { item_id: 7 } })
        );

      const res = await linkTreeApi.postLinkTreeItem(
        1,
        "Delcom",
        "https://delcom.org"
      );

      expect(res).toEqual({ item_id: 7 });
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1/items"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ title: "Delcom", url: "https://delcom.org" }),
        })
      );
    });

    it("should throw error on add item fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "URL tidak valid" })
      );

      await expect(linkTreeApi.postLinkTreeItem(1, "", "")).rejects.toThrow(
        "URL tidak valid"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.postLinkTreeItem(1, "", "")).rejects.toThrow(
        "Gagal menambahkan tautan"
      );
    });
  });

  describe("putLinkTreeItem", () => {
    it("should update item and return message on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", message: "Berhasil mengubah data" })
        );

      const msg = await linkTreeApi.putLinkTreeItem(
        1,
        2,
        "Baru",
        "https://example.com"
      );

      expect(msg).toBe("Berhasil mengubah data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1/items/2"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ title: "Baru", url: "https://example.com" }),
        })
      );
    });

    it("should throw error on update item fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Item tidak ditemukan" })
      );

      await expect(
        linkTreeApi.putLinkTreeItem(1, 2, "", "")
      ).rejects.toThrow("Item tidak ditemukan");
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(
        linkTreeApi.putLinkTreeItem(1, 2, "", "")
      ).rejects.toThrow("Gagal mengubah tautan");
    });
  });

  describe("deleteLinkTreeItem", () => {
    it("should delete item and return message on success", async () => {
      const spy = vi
        .spyOn(apiHelper, "fetchData")
        .mockResolvedValue(
          mockResponse({ status: "success", message: "Berhasil menghapus data" })
        );

      const msg = await linkTreeApi.deleteLinkTreeItem(1, 2);

      expect(msg).toBe("Berhasil menghapus data");
      expect(spy).toHaveBeenCalledWith(
        expect.stringContaining("/link-trees/1/items/2"),
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("should throw error on delete item fail", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail", message: "Gagal menghapus item" })
      );

      await expect(linkTreeApi.deleteLinkTreeItem(1, 2)).rejects.toThrow(
        "Gagal menghapus item"
      );
    });

    it("should use fallback error message when missing", async () => {
      vi.spyOn(apiHelper, "fetchData").mockResolvedValue(
        mockResponse({ status: "fail" })
      );

      await expect(linkTreeApi.deleteLinkTreeItem(1, 2)).rejects.toThrow(
        "Gagal menghapus tautan"
      );
    });
  });
});
