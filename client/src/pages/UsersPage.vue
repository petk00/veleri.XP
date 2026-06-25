<template>
  <q-page class="page">
    <div class="users-layout">

      <!-- ── Main ── -->
      <div class="users-main">

        <div v-if="loading" class="loading-full">
          <q-spinner color="primary" size="32px" />
        </div>

        <div v-else>
        <div class="users-toolbar">
          <q-icon name="search" size="15px" class="topbar__search-icon" />
          <input
            v-model="searchQuery"
            type="search"
            class="topbar__search"
            placeholder="Pretraži po imenu, emailu ili ulozi..."
          />
        </div>

        <div class="users-card">

          <div v-if="filteredUsers.length === 0" class="empty-state" style="padding: 48px 24px">
            <div class="empty-state__icon"><q-icon name="group" size="28px" /></div>
            <div class="empty-state__title">{{ users.length === 0 ? 'Nema korisnika' : 'Nema rezultata' }}</div>
            <div class="empty-state__hint">{{ users.length === 0 ? 'Dodajte prvog korisnika klikom na "Novi korisnik".' : 'Pokušajte s drugim pojmom.' }}</div>
          </div>

          <div v-else class="user-table">
            <div class="user-table__header">
              <button class="sort-btn" :class="{ 'sort-btn--active': sortKey === 'name' }" @click="toggleSort('name')">
                Ime i prezime
                <q-icon :name="sortKey === 'name' && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'" size="11px" class="sort-icon" />
              </button>
              <button class="sort-btn" :class="{ 'sort-btn--active': sortKey === 'email' }" @click="toggleSort('email')">
                Email
                <q-icon :name="sortKey === 'email' && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'" size="11px" class="sort-icon" />
              </button>
              <button class="sort-btn" :class="{ 'sort-btn--active': sortKey === 'role' }" @click="toggleSort('role')">
                Uloga
                <q-icon :name="sortKey === 'role' && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'" size="11px" class="sort-icon" />
              </button>
              <button class="sort-btn" :class="{ 'sort-btn--active': sortKey === 'status' }" @click="toggleSort('status')">
                Status
                <q-icon :name="sortKey === 'status' && sortDir === 'desc' ? 'arrow_downward' : 'arrow_upward'" size="11px" class="sort-icon" />
              </button>
              <span class="user-table__header-btn">
                <button class="btn btn--primary btn--sm" style="width:100%" type="button" @click="openCreateDialog">
                  <q-icon name="person_add" size="14px" />
                  <span>Novi korisnik</span>
                </button>
              </span>
            </div>
            <ul class="user-list">
              <li v-for="u in filteredUsers" :key="u.id_user" class="user-row">
                <div class="user-col-name">
                  <div class="user-avatar" :style="{ background: avatarColor(u) }">{{ initials(u) }}</div>
                  <span class="user-name">{{ u.first_name }} {{ u.last_name }}</span>
                </div>
                <span class="user-email">{{ u.email }}</span>
                <span class="user-role-pill" :class="u.role_name === 'Administrator' ? 'user-role-pill--admin' : 'user-role-pill--user'">
                  {{ u.role_name }}
                </span>
                <span class="user-status" :class="u.is_active ? 'user-status--active' : 'user-status--inactive'">
                  {{ u.is_active ? 'Aktivan' : 'Neaktivan' }}
                </span>
                <div class="user-actions">
                  <button class="icon-btn" title="Uredi" @click="openEditDialog(u)">
                    <q-icon name="edit" size="16px" />
                  </button>
                  <button class="icon-btn" title="Pošalji link za postavljanje lozinke" @click="resetLink(u)">
                    <q-icon name="key" size="16px" />
                  </button>
                  <button class="icon-btn" :title="u.is_active ? 'Deaktiviraj' : 'Aktiviraj'" @click="toggleStatus(u)">
                    <q-icon :name="u.is_active ? 'person_off' : 'person'" size="16px" />
                  </button>
                  <button class="icon-btn icon-btn--danger" title="Obriši korisnika" @click="deleteUser(u)">
                    <q-icon name="delete_outline" size="16px" />
                  </button>
                </div>
              </li>
            </ul>
          </div>

        </div>
        </div>
      </div>
    </div>

    <!-- Dialog: invite link -->
    <q-dialog v-model="inviteDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ inviteDialog.isReset ? 'Reset lozinke' : 'Korisnik kreiran' }}</h2>
          <button class="dialog-close" @click="inviteDialog.open = false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <div class="dialog-body">
          <p class="invite-info">
            <template v-if="inviteDialog.isReset">
              Proslijedite ovaj link korisniku <strong>{{ inviteDialog.name }}</strong> kako bi postavio novu lozinku:
            </template>
            <template v-else>
              Korisnik <strong>{{ inviteDialog.name }}</strong> je kreiran. Proslijedite ovaj link (Teams, email...) kako bi postavio lozinku:
            </template>
          </p>
          <div class="invite-link-box">
            <span class="invite-link-text">{{ inviteDialog.link }}</span>
          </div>
          <div class="dialog-actions" style="margin-top: 0;">
            <button type="button" class="btn btn--ghost" @click="inviteDialog.open = false">Zatvori</button>
            <button type="button" class="btn btn--primary" @click="copyLink">
              <q-icon :name="inviteDialog.copied ? 'check' : 'content_copy'" size="16px" />
              <span>{{ inviteDialog.copied ? 'Kopirano!' : 'Kopiraj link' }}</span>
            </button>
          </div>
        </div>
      </div>
    </q-dialog>

    <!-- Dialog: novi / uredi korisnik -->
    <q-dialog v-model="dialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">{{ dialog.isEdit ? 'Uredi korisnika' : 'Novi korisnik' }}</h2>
          <button class="dialog-close" @click="closeDialog">
            <q-icon name="close" size="20px" />
          </button>
        </div>

        <form class="dialog-body" @submit.prevent="submitDialog">

          <div class="field-row">
            <div class="field">
              <label class="field-label">Ime</label>
              <input v-model="form.first_name" type="text" class="text-input" placeholder="Ime" required />
            </div>
            <div class="field">
              <label class="field-label">Prezime</label>
              <input v-model="form.last_name" type="text" class="text-input" placeholder="Prezime" required />
            </div>
          </div>

          <div class="field">
            <label class="field-label">Email</label>
            <input v-model="form.email" type="email" class="text-input" placeholder="ime.prezime@veleri.hr" required />
          </div>

          <div class="field">
            <label class="field-label">Uloga</label>
            <select v-model="form.role_id" class="text-input" required>
              <option value="" disabled>Odaberi ulogu</option>
              <option v-for="r in roles" :key="r.id_role" :value="r.id_role">{{ r.name }}</option>
            </select>
          </div>

          <div v-if="dialog.error" class="form-error">{{ dialog.error }}</div>

          <div class="dialog-actions">
            <button type="button" class="btn btn--ghost" @click="closeDialog">Odustani</button>
            <button type="submit" class="btn btn--primary" :disabled="dialog.saving">
              <q-spinner v-if="dialog.saving" size="14px" color="white" />
              <span v-else>{{ dialog.isEdit ? 'Spremi' : 'Kreiraj korisnika' }}</span>
            </button>
          </div>

        </form>
      </div>
    </q-dialog>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

const $q = useQuasar();

const loading = ref(true);
const users = ref([]);
const roles = ref([]);
const searchQuery = ref('');
const sortKey = ref('name');
const sortDir = ref('asc');

const toggleSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
};

const filteredUsers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const list = q
    ? users.value.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.role_name || '').toLowerCase().includes(q)
      )
    : [...users.value];

  const dir = sortDir.value === 'asc' ? 1 : -1;
  return list.sort((a, b) => {
    let va, vb;
    if (sortKey.value === 'name')   { va = `${a.first_name} ${a.last_name}`; vb = `${b.first_name} ${b.last_name}`; }
    if (sortKey.value === 'email')  { va = a.email || ''; vb = b.email || ''; }
    if (sortKey.value === 'role')   { va = a.role_name || ''; vb = b.role_name || ''; }
    if (sortKey.value === 'status') { va = a.is_active ? 0 : 1; vb = b.is_active ? 0 : 1; return (va - vb) * dir; }
    return va.localeCompare(vb, 'hr') * dir;
  });
});

const dialog = ref({ open: false, isEdit: false, editId: null, error: '', saving: false });
const form = ref({ first_name: '', last_name: '', email: '', role_id: '' });
const inviteDialog = ref({ open: false, link: '', name: '', copied: false, isReset: false });

const avatarPalette = ['#1b2d59', '#00afdb', '#0e7490', '#1d4ed8', '#0369a1', '#0891b2', '#16294e', '#2563eb'];

const avatarColor = (u) => {
  const str = (u.first_name || '') + (u.last_name || '');
  const idx = [...str].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % avatarPalette.length;
  return avatarPalette[idx];
};

const initials = (u) =>
  `${u.first_name?.[0] || ''}${u.last_name?.[0] || ''}`.toUpperCase();

const loadUsers = async () => {
  try {
    const { data } = await api.get('/users');
    users.value = data;
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri dohvatu korisnika.' });
  } finally {
    loading.value = false;
  }
};

const loadRoles = async () => {
  try {
    const { data } = await api.get('/users/roles');
    roles.value = data;
  } catch {
    /* tiho */
  }
};

const openCreateDialog = () => {
  form.value = { first_name: '', last_name: '', email: '', role_id: '' };
  dialog.value = { open: true, isEdit: false, editId: null, error: '', saving: false };
};

const openEditDialog = (u) => {
  form.value = { first_name: u.first_name, last_name: u.last_name, email: u.email, role_id: u.id_role || roles.value.find(r => r.name === u.role_name)?.id_role || '' };
  dialog.value = { open: true, isEdit: true, editId: u.id_user, error: '', saving: false };
};

const closeDialog = () => { dialog.value.open = false; };

const submitDialog = async () => {
  dialog.value.error = '';
  dialog.value.saving = true;
  try {
    if (dialog.value.isEdit) {
      await api.put(`/users/${dialog.value.editId}`, form.value);
      $q.notify({ type: 'positive', message: 'Korisnik ažuriran.' });
      closeDialog();
    } else {
      const { data } = await api.post('/users', form.value);
      closeDialog();
      inviteDialog.value = {
        open: true,
        link: data.inviteLink,
        name: `${form.value.first_name} ${form.value.last_name}`,
        copied: false,
        isReset: false,
      };
    }
    loading.value = true;
    await loadUsers();
  } catch (err) {
    dialog.value.error = err?.response?.data?.message || 'Greška pri spremanju.';
  } finally {
    dialog.value.saving = false;
  }
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteDialog.value.link);
    inviteDialog.value.copied = true;
    setTimeout(() => { inviteDialog.value.copied = false; }, 2000);
  } catch {
    $q.notify({ type: 'negative', message: 'Kopiranje nije uspjelo. Kopirajte link ručno.' });
  }
};

const resetLink = async (u) => {
  try {
    const { data } = await api.post(`/users/${u.id_user}/reset-link`);
    inviteDialog.value = {
      open: true,
      link: data.inviteLink,
      name: `${u.first_name} ${u.last_name}`,
      copied: false,
      isReset: true,
    };
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri generiranju linka.' });
  }
};

const deleteUser = (u) => {
  $q.dialog({
    title: 'Brisanje korisnika',
    message: `Jeste li sigurni da želite obrisati korisnika <strong>${u.first_name} ${u.last_name}</strong>?`,
    html: true,
    cancel: { label: 'Odustani', flat: true },
    ok: { label: 'Obriši', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.delete(`/users/${u.id_user}`);
      $q.notify({ type: 'positive', message: 'Korisnik obrisan.' });
      await loadUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Greška pri brisanju korisnika.';
      $q.notify({ type: 'negative', message: msg, timeout: 4000 });
    }
  });
};

const toggleStatus = async (u) => {
  const deactivating = u.is_active;
  $q.dialog({
    title: deactivating ? 'Deaktivacija korisnika' : 'Aktivacija korisnika',
    message: deactivating
      ? `Jeste li sigurni da želite deaktivirati korisnika <strong>${u.first_name} ${u.last_name}</strong>?<br><br>Korisnik više neće moći pristupiti sustavu.`
      : `Želite li aktivirati korisnika <strong>${u.first_name} ${u.last_name}</strong>?`,
    html: true,
    cancel: { label: 'Odustani', flat: true, color: 'primary' },
    ok: deactivating
      ? { label: 'Deaktiviraj', color: 'negative', flat: true }
      : { label: 'Aktiviraj', color: 'positive', flat: true },
    persistent: true,
  }).onOk(async () => {
    try {
      await api.patch(`/users/${u.id_user}/status`, { is_active: !u.is_active });
      $q.notify({ type: 'positive', message: deactivating ? 'Korisnik deaktiviran.' : 'Korisnik aktiviran.' });
      await loadUsers();
    } catch {
      $q.notify({ type: 'negative', message: 'Greška pri promjeni statusa.' });
    }
  });
};

onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles()]);
});
</script>

<style scoped>
/* ── Base ── */
.page {
  padding: 0;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  height: 100%;
}

/* ── Layout ── */
.users-layout { display: flex; flex-direction: column; min-height: 100%; }

/* ── Toolbar above card ── */
.users-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  margin-bottom: 20px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
}

.topbar__search-icon { color: #9ca3af; flex-shrink: 0; }
.topbar__search {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font: inherit;
  font-size: 0.8125rem;
  color: #111827;
  min-width: 0;
}
.topbar__search::placeholder { color: #9ca3af; }

/* ── Main content ── */
.users-main { padding: 32px 40px; }

/* ── Loading ── */
.loading-full {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px;
}

/* ── Card ── */
.users-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

/* ── User table ── */
.user-table { width: 100%; }

.user-table__header,
.user-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr) 148px;
  align-items: center;
  padding: 0 20px;
}

.user-table__header {
  height: 40px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.user-table__header-btn {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.sort-btn {
  all: unset;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  transition: color 0.1s;
}
.sort-btn:hover { color: #6b7280; }
.sort-btn--active { color: #111827; }

.sort-icon { opacity: 0.4; }
.sort-btn--active .sort-icon { opacity: 1; }


.user-list { list-style: none; margin: 0; padding: 0; }

.user-row {
  height: 56px;
  border-bottom: 1px solid #f3f4f6;
  transition: background 0.12s;
}
.user-row:last-child { border-bottom: none; }
.user-row:hover { background: #f0fbfe; }

.user-col-name {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding-right: 12px;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name  { font-size: 0.875rem; font-weight: 600; color: #111827; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-email { font-size: 0.8125rem; color: #6b7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 12px; }

.user-role-pill,
.user-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 110px;
  padding: 4px 0;
  border-radius: 20px;
  font-size: 0.6875rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.user-role-pill--admin { color: #1e40af; background: #dbeafe; }
.user-role-pill--user  { color: #065f46; background: #d1fae5; }
.user-status--active   { color: #065f46; background: #d1fae5; }
.user-status--inactive { color: #991b1b; background: #fee2e2; }

.user-actions { display: flex; width: 100%; justify-content: space-between; }

/* ── Dialog fields ── */
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 0.8125rem; font-weight: 500; color: #374151; }

.text-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.875rem;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus {
  border-color: #00afdb;
  box-shadow: 0 0 0 3px rgba(0, 175, 219, 0.12);
}

/* ── Invite link ── */
.invite-info { margin: 0 0 12px; font-size: 0.875rem; color: #374151; line-height: 1.5; }

.invite-link-box {
  padding: 10px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  margin-bottom: 16px;
  overflow-x: auto;
}

.invite-link-text {
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 0.8rem;
  color: #0067b8;
  word-break: break-all;
  user-select: all;
}

@media (max-width: 760px) {
  .users-topbar { padding: 10px 16px; }
  .users-main { padding: 20px 16px; }
  .user-table__header,
  .user-row { grid-template-columns: 1fr 100px 36px; }
  .user-email,
  .user-role-pill { display: none; }
}
</style>
