<template>
  <q-page class="page">
    <div class="page-shell">

      <header class="page-header">
        <div class="page-header__main">
          <div class="page-header__eyebrow">Administracija</div>
          <h1 class="page-header__title">Korisnici</h1>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--cta" type="button" @click="openCreateDialog">
            <q-icon name="person_add" size="18px" />
            <span>Novi korisnik</span>
          </button>
        </div>
      </header>

      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="28px" />
      </div>

      <section v-else class="list-surface">

        <div class="surface-header">
          <h2 class="surface-title">Svi korisnici</h2>
          <span class="surface-count">{{ users.length }}</span>
        </div>

        <div v-if="users.length === 0" class="empty-state">
          <div class="empty-state__icon"><q-icon name="group" size="28px" /></div>
          <div class="empty-state__title">Nema korisnika</div>
          <div class="empty-state__hint">Dodajte prvog korisnika klikom na "Novi korisnik".</div>
        </div>

        <ul v-else class="user-list">
          <li v-for="u in users" :key="u.id_user" class="user-row">
            <div class="user-avatar" :style="{ background: avatarColor(u) }">
              {{ initials(u) }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ u.first_name }} {{ u.last_name }}</span>
              <span class="user-email">{{ u.email }}</span>
            </div>
            <span class="user-role">{{ u.role_name }}</span>
            <span class="user-status" :class="u.is_active ? 'user-status--active' : 'user-status--inactive'">
              {{ u.is_active ? 'Aktivan' : 'Neaktivan' }}
            </span>
            <div class="user-actions">
              <button class="action-btn" title="Uredi" @click="openEditDialog(u)">
                <q-icon name="edit" size="16px" />
              </button>
              <button
                class="action-btn"
                :title="u.is_active ? 'Deaktiviraj' : 'Aktiviraj'"
                @click="toggleStatus(u)"
              >
                <q-icon :name="u.is_active ? 'person_off' : 'person'" size="16px" />
              </button>
              <button class="action-btn action-btn--danger" title="Obriši" @click="deleteUser(u)">
                <q-icon name="delete_outline" size="16px" />
              </button>
            </div>
          </li>
        </ul>

      </section>
    </div>

    <!-- Dialog: invite link -->
    <q-dialog v-model="inviteDialog.open" persistent>
      <div class="dialog-card">
        <div class="dialog-header">
          <h2 class="dialog-title">Korisnik kreiran</h2>
          <button class="dialog-close" @click="inviteDialog.open = false">
            <q-icon name="close" size="20px" />
          </button>
        </div>
        <div class="dialog-body">
          <p class="invite-info">
            Korisnik <strong>{{ inviteDialog.name }}</strong> je kreiran s neaktivnim računom.
            Proslijedite ovaj link korisniku (Teams, email...) kako bi postavio lozinku:
          </p>
          <div class="invite-link-box">
            <span class="invite-link-text">{{ inviteDialog.link }}</span>
          </div>
          <div class="dialog-actions" style="margin-top: 0;">
            <button type="button" class="btn btn--secondary" @click="inviteDialog.open = false">Zatvori</button>
            <button type="button" class="btn btn--cta" @click="copyLink">
              <q-icon name="content_copy" size="16px" />
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
            <button type="button" class="btn btn--secondary" @click="closeDialog">Odustani</button>
            <button type="submit" class="btn btn--cta" :disabled="dialog.saving">
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
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';

const $q = useQuasar();

const loading = ref(true);
const users = ref([]);
const roles = ref([]);

const dialog = ref({ open: false, isEdit: false, editId: null, error: '', saving: false });
const form = ref({ first_name: '', last_name: '', email: '', role_id: '' });
const inviteDialog = ref({ open: false, link: '', name: '', copied: false });

const avatarPalette = ['#0067b8', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#9333ea', '#be185d'];

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
  const action = u.is_active ? 'deaktivirati' : 'aktivirati';
  $q.dialog({
    title: 'Potvrda',
    message: `Želite li ${action} korisnika ${u.first_name} ${u.last_name}?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      await api.patch(`/users/${u.id_user}/status`, { is_active: !u.is_active });
      $q.notify({ type: 'positive', message: u.is_active ? 'Korisnik deaktiviran.' : 'Korisnik aktiviran.' });
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
.page {
  min-height: 100vh;
  padding: 38px 40px 72px;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell { max-width: 900px; margin: 0 auto; }

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-header__eyebrow {
  margin-bottom: 8px;
  color: #0067b8;
  font-size: 0.75rem;
  font-weight: 600;
}

.page-header__title {
  margin: 0;
  color: #111827;
  font-size: 2.25rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.1;
}

.page-header__actions { flex-shrink: 0; }

.btn--cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 20px;
  border: none;
  border-radius: 3px;
  background: #0067b8;
  color: #fff;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn--cta:hover:not(:disabled) { background: #005a9e; }
.btn--cta:disabled { opacity: 0.55; cursor: not-allowed; }

.btn--secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 20px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  background: #fff;
  color: #374151;
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}
.btn--secondary:hover { background: #f9fafb; }

.loading-block { display: flex; justify-content: center; padding: 64px 0; }

/* ── List surface ── */
.list-surface { border: 1px solid #e5e7eb; background: #fff; overflow: hidden; }

.surface-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.surface-title { margin: 0; font-size: 0.8125rem; font-weight: 600; color: #111827; }
.surface-count { color: #6b7280; font-size: 0.75rem; }

/* ── User list ── */
.user-list { list-style: none; margin: 0; padding: 0; }

.user-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 20px;
  border-bottom: 1px solid #f3f4f6;
}
.user-row:last-child { border-bottom: none; }

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

.user-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.user-email {
  font-size: 0.75rem;
  color: #6b7280;
}

.user-role {
  font-size: 0.75rem;
  color: #4b5563;
  min-width: 110px;
  flex-shrink: 0;
}

.user-status {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 3px;
  flex-shrink: 0;
}
.user-status--active { color: #065f46; background: #d1fae5; }
.user-status--inactive { color: #6b7280; background: #f3f4f6; }

.user-actions { display: flex; gap: 4px; flex-shrink: 0; }

.action-btn {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 3px;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.action-btn:hover { background: #f3f4f6; color: #111827; }
.action-btn--danger:hover { background: #fef2f2; color: #dc2626; }

/* ── Empty state ── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 56px 24px;
  text-align: center;
}
.empty-state__icon {
  display: flex;
  width: 48px;
  height: 48px;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
  border: 1px solid #e5e7eb;
  color: #9ca3af;
}
.empty-state__title { margin: 0 0 6px; font-size: 0.9375rem; font-weight: 600; color: #111827; }
.empty-state__hint { max-width: 300px; color: #6b7280; font-size: 0.8125rem; line-height: 1.5; }

/* ── Dialog ── */
.dialog-card {
  width: 480px;
  max-width: 95vw;
  background: #fff;
  border-top: 2px solid #0067b8;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.14);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
}

.dialog-title { margin: 0; font-size: 1rem; font-weight: 600; color: #111827; }

.dialog-close {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 3px;
  color: #6b7280;
  cursor: pointer;
}
.dialog-close:hover { background: #f3f4f6; color: #111827; }

.dialog-body { padding: 20px 24px 24px; display: flex; flex-direction: column; gap: 16px; }

.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }

.field { display: flex; flex-direction: column; gap: 6px; }

.field-label { font-size: 0.8125rem; font-weight: 500; color: #374151; }

.text-input {
  width: 100%;
  height: 38px;
  padding: 0 10px;
  border: 1px solid #d1d5db;
  border-radius: 3px;
  outline: none;
  background: #fff;
  color: #111827;
  font: inherit;
  font-size: 0.9375rem;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.text-input:focus { border-color: #0067b8; box-shadow: 0 0 0 2px rgba(0,103,184,0.14); }

.form-error {
  padding: 9px 12px;
  border-left: 3px solid #c50f1f;
  background: #fef2f2;
  color: #991b1b;
  font-size: 0.8125rem;
  line-height: 1.4;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

/* ── Invite link ── */
.invite-info {
  margin: 0 0 12px;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
}

.invite-link-box {
  padding: 10px 12px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
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

/* ── Responsive ── */
@media (max-width: 760px) {
  .page { padding: 24px 16px 56px; }
  .page-header { flex-direction: column; align-items: stretch; gap: 16px; }
  .page-header__title { font-size: 1.75rem; }
  .user-role { display: none; }
}
</style>
