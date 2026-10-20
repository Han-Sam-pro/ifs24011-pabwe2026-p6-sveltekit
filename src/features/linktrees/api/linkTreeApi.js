import apiHelper from "../../../helpers/apiHelper";

const linkTreeApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/link-trees`;

  function _url(path) {
    return BASE_URL + path;
  }

  async function _parse(response, fallbackMessage) {
    const result = await response.json();
    if (result.status !== "success" && !result.success) {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  async function postLinkTree(title, type, description) {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, type, description }),
    });

    const result = await _parse(response, "Gagal menambahkan link tree");
    return result.data;
  }

  async function postLinkTreeCover(linkTreeId, cover) {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}/cover`), {
      method: "POST",
      body: formData,
    });

    const result = await _parse(response, "Gagal mengubah cover");
    return result.message;
  }

  async function putLinkTree(linkTreeId, title, type, description) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}`), {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, type, description }),
    });

    const result = await _parse(response, "Gagal mengubah link tree");
    return result.message;
  }

  async function getLinkTrees(is_me = "") {
    const targetUrl =
      is_me !== "" && is_me !== null && is_me !== undefined
        ? `/?is_me=${is_me}`
        : "/";

    const response = await apiHelper.fetchData(_url(targetUrl), {
      method: "GET",
    });

    const result = await _parse(response, "Gagal mengambil data link tree");
    return result.data?.link_trees || [];
  }

  async function getLinkTreeById(linkTreeId) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}`), {
      method: "GET",
    });

    const result = await _parse(response, "Gagal mengambil detail link tree");
    return result.data?.link_tree;
  }

  async function deleteLinkTree(linkTreeId) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}`), {
      method: "DELETE",
    });

    const result = await _parse(response, "Gagal menghapus link tree");
    return result.message;
  }

  async function deleteAllLinkTrees() {
    const response = await apiHelper.fetchData(_url("/"), {
      method: "DELETE",
    });

    const result = await _parse(response, "Gagal menghapus semua link tree");
    return result.message;
  }

  async function postLinkTreeItem(linkTreeId, title, url) {
    const response = await apiHelper.fetchData(_url(`/${linkTreeId}/items`), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, url }),
    });

    const result = await _parse(response, "Gagal menambahkan tautan");
    return result.data;
  }

  async function putLinkTreeItem(linkTreeId, itemId, title, url) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}/items/${itemId}`),
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, url }),
      }
    );

    const result = await _parse(response, "Gagal mengubah tautan");
    return result.message;
  }

  async function deleteLinkTreeItem(linkTreeId, itemId) {
    const response = await apiHelper.fetchData(
      _url(`/${linkTreeId}/items/${itemId}`),
      {
        method: "DELETE",
      }
    );

    const result = await _parse(response, "Gagal menghapus tautan");
    return result.message;
  }

  return {
    postLinkTree,
    postLinkTreeCover,
    putLinkTree,
    getLinkTrees,
    getLinkTreeById,
    deleteLinkTree,
    deleteAllLinkTrees,
    postLinkTreeItem,
    putLinkTreeItem,
    deleteLinkTreeItem,
  };
})();

export default linkTreeApi;
