<script>
  import { onMount } from "svelte";
  import { navigate } from "../../../router.js";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ItemModal from "../modals/ItemModal.svelte";
  import { linkTreesStore } from "../states/linkTreesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, hasCover, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Pencil,
    Trash2,
    Calendar,
    Plus,
    Link,
  } from "lucide-svelte";

  export let linkTreeId;

  const TYPE_STYLES = {
    public: "bg-emerald-50 text-emerald-700 border-emerald-200",
    unlisted: "bg-amber-50 text-amber-700 border-amber-200",
    private: "bg-slate-100 text-slate-700 border-slate-200",
  };

  $: profile = $usersStore.profile;
  $: linkTree = $linkTreesStore.linkTree;

  let showCoverModal = false;
  let showEditModal = false;
  let showItemModal = false;
  let selectedItem = null;

  onMount(() => {
    if (linkTreeId) {
      linkTreesStore.asyncSetLinkTree(linkTreeId);
    }
  });

  let prevId = linkTreeId;
  $: if (linkTreeId !== prevId) {
    prevId = linkTreeId;
    linkTreesStore.asyncSetLinkTree(linkTreeId);
  }

  $: if ($linkTreesStore.isLinkTree) {
    linkTreesStore.setIsLinkTree(false);
    if (!linkTree) {
      navigate("/");
    }
  }

  $: if ($linkTreesStore.isLinkTreeDeleted) {
    linkTreesStore.setIsLinkTreeDeleted(false);
    navigate("/");
  }

  $: if ($linkTreesStore.isLinkTreeItemDeleted) {
    linkTreesStore.setIsLinkTreeItemDeleted(false);
    linkTreesStore.asyncSetLinkTree(linkTreeId);
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus link tree ini?");
    if (result.isConfirmed && linkTree) {
      linkTreesStore.asyncSetIsLinkTreeDelete(linkTree.id);
    }
  }

  function handleAddItem() {
    selectedItem = null;
    showItemModal = true;
  }

  function handleEditItem(item) {
    selectedItem = item;
    showItemModal = true;
  }

  async function handleDeleteItem(item) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus tautan ini?");
    if (result.isConfirmed) {
      linkTreesStore.asyncSetIsLinkTreeItemDelete(linkTree.id, item.id);
    }
  }
</script>

{#if !profile || !linkTree}
  <div class="flex flex-col items-center justify-center py-20">
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  {@const items = linkTree.items || []}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Back button & Action buttons -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-link-trees-link"
        on:click|preventDefault={() => navigate("/")}
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Link Tree
      </a>

      <div class="flex items-center gap-2">
        <button
          type="button"
          data-testid="edit-cover-btn"
          on:click={() => (showCoverModal = true)}
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
        >
          <ImagePlus size={16} />
          Ubah Sampul
        </button>
        <button
          type="button"
          data-testid="edit-detail-link-tree-btn"
          on:click={() => (showEditModal = true)}
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
        >
          <PenLine size={16} />
          Ubah Data
        </button>
        <button
          type="button"
          data-testid="delete-detail-link-tree-btn"
          on:click={handleDelete}
          class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
        >
          <Trash2 size={16} />
          Hapus
        </button>
      </div>
    </div>

    <!-- Main Detail Card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if hasCover(linkTree.cover)}
        <div class="relative w-full h-64 sm:h-80 bg-slate-900 overflow-hidden">
          <img
            src={linkTree.cover}
            alt={linkTree.title}
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent"></div>
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-500">
              {"#" + linkTree.id}
            </span>
            <span
              data-testid="detail-type-badge"
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border capitalize {TYPE_STYLES[linkTree.type] || TYPE_STYLES.private}"
            >
              {linkTree.type}
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {linkTree.title}
          </h1>

          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span>Oleh: <strong class="text-slate-500">{linkTree.author?.name || "-"}</strong></span>
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Dibuat: <strong class="text-slate-500">{formatDate(linkTree.created_at)}</strong></span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              <span>Diperbarui: <strong class="text-slate-500">{formatDate(linkTree.updated_at)}</strong></span>
            </div>
          </div>
        </div>

        <div
          data-testid="link-tree-detail-description"
          class="text-slate-600 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >
          {#if linkTree.description}
            {linkTree.description}
          {:else}
            <p class="italic text-slate-500">Tidak ada deskripsi untuk link tree ini.</p>
          {/if}
        </div>
      </div>
    </div>

    <!-- Items -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div class="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-slate-100">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Daftar Tautan</h2>
          <p class="text-xs text-slate-500 mt-0.5">{items.length} tautan di halaman ini</p>
        </div>
        <button
          type="button"
          data-testid="add-item-btn"
          on:click={handleAddItem}
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tambah Tautan
        </button>
      </div>

      {#if items.length === 0}
        <div class="px-6 py-12 text-center text-slate-500">
          <Link size={36} class="mx-auto text-slate-300 mb-2" />
          <p class="font-medium">Belum ada tautan. Tambahkan tautan pertama Anda.</p>
        </div>
      {:else}
        <ul class="divide-y divide-slate-100">
          {#each items as item (item.id)}
            <li
              data-testid={`item-row-${item.id}`}
              class="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 hover:bg-slate-50/70 transition-colors"
            >
              <div class="min-w-0">
                <p class="font-semibold text-slate-800 truncate">{item.title}</p>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-xs text-indigo-600 hover:underline break-all"
                >
                  {item.url}
                </a>
              </div>
              <div class="inline-flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  data-testid={`edit-item-${item.id}`}
                  on:click={() => handleEditItem(item)}
                  class="p-1.5 text-slate-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Ubah Tautan"
                >
                  <Pencil size={18} />
                </button>
                <button
                  type="button"
                  data-testid={`delete-item-${item.id}`}
                  on:click={() => handleDeleteItem(item)}
                  class="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus Tautan"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Cover Modal -->
    <ChangeCoverModal
      show={showCoverModal}
      {linkTree}
      onClose={() => (showCoverModal = false)}
      on:close={() => (showCoverModal = false)}
    />

    <!-- Edit Modal -->
    <ChangeModal
      show={showEditModal}
      linkTreeId={linkTree.id}
      onClose={() => (showEditModal = false)}
      on:close={() => (showEditModal = false)}
    />

    <!-- Item Modal (tambah / ubah) -->
    <ItemModal
      show={showItemModal}
      linkTreeId={linkTree.id}
      item={selectedItem}
      onClose={() => (showItemModal = false)}
      on:close={() => (showItemModal = false)}
    />
  </div>
{/if}
