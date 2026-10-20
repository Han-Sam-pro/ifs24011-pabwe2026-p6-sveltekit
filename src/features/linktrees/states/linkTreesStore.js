import { writable } from "svelte/store";
import linkTreeApi from "../api/linkTreeApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

function createLinkTreesStore() {
  const initial = {
    linkTrees: [],
    linkTree: null,
    isLinkTree: false,
    isLinkTreeAdd: false,
    isLinkTreeAdded: false,
    isLinkTreeChange: false,
    isLinkTreeChanged: false,
    isLinkTreeChangeCover: false,
    isLinkTreeChangedCover: false,
    isLinkTreeDelete: false,
    isLinkTreeDeleted: false,
    isLinkTreeDeleteAll: false,
    isLinkTreeDeletedAll: false,
    isLinkTreeItemAdd: false,
    isLinkTreeItemAdded: false,
    isLinkTreeItemChange: false,
    isLinkTreeItemChanged: false,
    isLinkTreeItemDelete: false,
    isLinkTreeItemDeleted: false,
  };

  let currentState = { ...initial };
  const innerStore = writable(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  const store = {
    subscribe: innerStore.subscribe,
    get $state() {
      return currentState;
    },
    reset(state = initial) {
      innerStore.set({ ...initial, ...state });
    },
  };

  // Getter & setter untuk setiap kunci state (linkTrees -> setLinkTrees, dst.)
  Object.keys(initial).forEach((key) => {
    Object.defineProperty(store, key, {
      get: () => currentState[key],
      enumerable: true,
    });
    store[`set${key.charAt(0).toUpperCase()}${key.slice(1)}`] = (value) => {
      innerStore.update((s) => ({ ...s, [key]: value }));
    };
  });

  // Pola umum mutasi: panggil API -> dialog -> set bendera hasil -> set bendera selesai
  async function mutate(call, fallbackMessage, setDone, setFlag) {
    try {
      const message = await call();
      showSuccessDialog(message || fallbackMessage);
      setDone(true);
    } catch (error) {
      showErrorDialog(error.message);
      setDone(false);
    } finally {
      setFlag(true);
    }
  }

  store.asyncSetLinkTrees = async function (is_me = "") {
    try {
      const linkTrees = await linkTreeApi.getLinkTrees(is_me);
      store.setLinkTrees(linkTrees);
    } catch {
      store.setLinkTrees([]);
    }
  };

  store.asyncSetLinkTree = async function (linkTreeId) {
    try {
      const linkTree = await linkTreeApi.getLinkTreeById(linkTreeId);
      store.setLinkTree(linkTree);
    } catch {
      store.setLinkTree(null);
    } finally {
      store.setIsLinkTree(true);
    }
  };

  store.asyncSetIsLinkTreeAdd = function (title, type, description) {
    return mutate(
      async () => {
        await linkTreeApi.postLinkTree(title, type, description);
      },
      "Link tree berhasil ditambahkan!",
      (v) => store.setIsLinkTreeAdded(v),
      (v) => store.setIsLinkTreeAdd(v)
    );
  };

  store.asyncSetIsLinkTreeChange = function (linkTreeId, title, type, description) {
    return mutate(
      () => linkTreeApi.putLinkTree(linkTreeId, title, type, description),
      "Link tree berhasil diperbarui!",
      (v) => store.setIsLinkTreeChanged(v),
      (v) => store.setIsLinkTreeChange(v)
    );
  };

  store.asyncSetIsLinkTreeChangeCover = function (linkTreeId, cover) {
    return mutate(
      () => linkTreeApi.postLinkTreeCover(linkTreeId, cover),
      "Cover berhasil diperbarui!",
      (v) => store.setIsLinkTreeChangedCover(v),
      (v) => store.setIsLinkTreeChangeCover(v)
    );
  };

  store.asyncSetIsLinkTreeDelete = function (linkTreeId) {
    return mutate(
      () => linkTreeApi.deleteLinkTree(linkTreeId),
      "Link tree berhasil dihapus!",
      (v) => store.setIsLinkTreeDeleted(v),
      (v) => store.setIsLinkTreeDelete(v)
    );
  };

  store.asyncSetIsLinkTreeDeleteAll = function () {
    return mutate(
      () => linkTreeApi.deleteAllLinkTrees(),
      "Semua link tree berhasil dihapus!",
      (v) => store.setIsLinkTreeDeletedAll(v),
      (v) => store.setIsLinkTreeDeleteAll(v)
    );
  };

  store.asyncSetIsLinkTreeItemAdd = function (linkTreeId, title, url) {
    return mutate(
      async () => {
        await linkTreeApi.postLinkTreeItem(linkTreeId, title, url);
      },
      "Tautan berhasil ditambahkan!",
      (v) => store.setIsLinkTreeItemAdded(v),
      (v) => store.setIsLinkTreeItemAdd(v)
    );
  };

  store.asyncSetIsLinkTreeItemChange = function (linkTreeId, itemId, title, url) {
    return mutate(
      () => linkTreeApi.putLinkTreeItem(linkTreeId, itemId, title, url),
      "Tautan berhasil diperbarui!",
      (v) => store.setIsLinkTreeItemChanged(v),
      (v) => store.setIsLinkTreeItemChange(v)
    );
  };

  store.asyncSetIsLinkTreeItemDelete = function (linkTreeId, itemId) {
    return mutate(
      () => linkTreeApi.deleteLinkTreeItem(linkTreeId, itemId),
      "Tautan berhasil dihapus!",
      (v) => store.setIsLinkTreeItemDeleted(v),
      (v) => store.setIsLinkTreeItemDelete(v)
    );
  };

  return store;
}

export const linkTreesStore = createLinkTreesStore();
export const useLinkTreesStore = () => linkTreesStore;
export default linkTreesStore;
