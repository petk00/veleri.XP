<template>
  <q-page class="page">
    <div class="shell">
      <!-- Back link -->
      <button class="back-link" @click="goBack">
        <q-icon name="arrow_back" size="14px" />
        <span>Natrag na zahtjeve</span>
      </button>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <q-spinner color="primary" size="28px" />
      </div>

      <!-- Content -->
      <div v-else-if="request">
        <!-- Header -->
        <header class="page-header">
          <div class="eyebrow">Zahtjev za nabavu</div>
          <div class="title-row">
            <h1 class="title">{{ request.request_number }}</h1>
            <span class="status-pill" :class="statusClass(request.fk_request_status)">
              <span class="status-dot" />
              {{ request.status_name }}
            </span>
            <span class="spacer" />
            <button v-if="canEdit" class="ghost-btn" @click="editRequest">
              <q-icon name="edit" size="14px" />
              Uredi
            </button>
          </div>
          <div class="meta">
            {{ request.created_by }} · {{ formatDate(request.created_at) }}
          </div>
        </header>

        <!-- ACTION BANNER: Preuzmi (status 1 → 2) -->
        <div v-if="canTakeOver" class="action-card action-card--neutral">
          <div class="action-card__body">
            <div class="action-card__title">Novi zahtjev čeka pregled</div>
            <div class="action-card__desc">
              Preuzmite zahtjev na obradu kako biste ga mogli odobriti, vratiti na izmjenu ili odbiti.
            </div>
          </div>
          <div class="action-card__btns">
            <button class="btn btn--primary" :disabled="submittingAction" @click="quickAction('preuzmi')">
              <q-spinner v-if="submittingAction" size="14px" />
              <q-icon v-else name="assignment_turned_in" size="16px" />
              Preuzmi na obradu
            </button>
          </div>
        </div>

        <!-- ACTION BANNER: Odobri / Vrati / Odbij (status 2) -->
        <div v-if="canDecide" class="action-card action-card--decision">
          <div class="action-card__body">
            <div class="action-card__title">Potrebna vaša odluka</div>
            <div class="action-card__desc">
              Pregledajte zahtjev i odlučite hoćete li ga odobriti, vratiti na dopunu ili odbiti.
            </div>
            <div v-if="!hasPonuda" class="action-card__hint">
              <q-icon name="info" size="14px" />
              Za odobravanje je potrebna priložena ponuda.
            </div>
          </div>
          <div class="action-card__btns">
            <button class="btn btn--ghost" @click="openActionDialog('vrati-na-izmjenu')">
              <q-icon name="undo" size="16px" />
              Vrati na izmjenu
            </button>
            <button class="btn btn--danger" @click="openActionDialog('odbij')">
              <q-icon name="close" size="16px" />
              Odbij
            </button>
            <button class="btn btn--primary" :disabled="!hasPonuda" @click="openActionDialog('odobri')">
              <q-icon name="check" size="16px" />
              Odobri
            </button>
          </div>
        </div>

        <!-- ACTION BANNER: Resubmit (status 3, creator) -->
        <div v-if="canResubmit" class="action-card action-card--info">
          <div class="action-card__body">
            <div class="action-card__title">Zahtjev je vraćen na izmjenu</div>
            <div class="action-card__desc">
              Uredite zahtjev prema komentaru administratora i pošaljite ga ponovno.
            </div>
          </div>
          <div class="action-card__btns">
            <button class="btn btn--ghost" @click="editRequest">
              <q-icon name="edit" size="16px" />
              Uredi
            </button>
            <button class="btn btn--primary" :disabled="submittingAction" @click="quickAction('resubmit')">
              <q-spinner v-if="submittingAction" size="14px" />
              <q-icon v-else name="send" size="16px" />
              Pošalji ponovno
            </button>
          </div>
        </div>

        <!-- ACTION BANNER: Završi (status 6) -->
        <div v-if="canFinish" class="action-card action-card--success">
          <div class="action-card__body">
            <div class="action-card__title">Zahtjev je odobren</div>
            <div class="action-card__desc">
              <span v-if="canCloseRequest">
                Svi dokumenti su priloženi. Zahtjev možete označiti kao završen.
              </span>
              <span v-else>
                Za završetak je potrebna i ponuda i otpremnica.
              </span>
            </div>
            <div v-if="!canCloseRequest" class="action-card__hint">
              <q-icon name="info" size="14px" />
              Nedostaje:
              <span v-if="!hasPonuda">ponuda</span>
              <span v-if="!hasPonuda && !hasOtpremnica">, </span>
              <span v-if="!hasOtpremnica">otpremnica</span>
            </div>
          </div>
          <div class="action-card__btns">
            <button class="btn btn--primary" :disabled="!canCloseRequest || submittingAction" @click="quickAction('zavrsi')">
              <q-spinner v-if="submittingAction" size="14px" />
              <q-icon v-else name="task_alt" size="16px" />
              Označi završeno
            </button>
          </div>
        </div>

        <!-- INFO: Basic data + Justification -->
        <div class="grid">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Osnovni podaci</h2>
            </div>
            <dl class="info-list">
              <div class="info-row">
                <dt>Fiskalna godina</dt>
                <dd>{{ request.fiscal_year }}</dd>
              </div>
              <div class="info-row">
                <dt>Odjel / Služba</dt>
                <dd>{{ request.department_name }}</dd>
              </div>
              <div class="info-row">
                <dt>Status</dt>
                <dd>
                  <span class="status-pill status-pill--sm" :class="statusClass(request.fk_request_status)">
                    <span class="status-dot" />
                    {{ request.status_name }}
                  </span>
                </dd>
              </div>
              <div class="info-row">
                <dt>Podnositelj</dt>
                <dd>{{ request.created_by }}</dd>
              </div>
              <div class="info-row">
                <dt>Procijenjeni iznos</dt>
                <dd>{{ formatCurrency(request.total_amount) }}</dd>
              </div>
              <div class="info-row">
                <dt>Datum kreiranja</dt>
                <dd>{{ formatDate(request.created_at) }}</dd>
              </div>
              <div v-if="request.updated_at && request.updated_at !== request.created_at" class="info-row">
                <dt>Zadnja izmjena</dt>
                <dd>{{ formatDate(request.updated_at) }}</dd>
              </div>
            </dl>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Svrha nabave</h2>
            </div>
            <p class="prose">{{ request.justification || 'Nema unesenog obrazloženja.' }}</p>
          </div>
        </div>

        <!-- ITEMS -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Stavke</h2>
            <span class="badge">{{ items.length }}</span>
          </div>
          <table v-if="items.length > 0" class="items-table">
            <thead>
              <tr>
                <th>Naziv artikla</th>
                <th>Kategorija</th>
                <th class="text-right">Količina</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.id_purchase_request_item">
                <td>{{ item.item_name }}</td>
                <td><span class="muted">{{ item.category_name }}</span></td>
                <td class="text-right mono">{{ item.quantity }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">Nema stavki.</div>
        </div>

        <!-- DOCUMENTS -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Dokumenti</h2>
            <div class="doc-indicators">
              <span class="doc-indicator" :class="{ 'doc-indicator--ok': hasPonuda }">
                <q-icon :name="hasPonuda ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
                Ponuda
              </span>
              <span class="doc-indicator" :class="{ 'doc-indicator--ok': hasOtpremnica }">
                <q-icon :name="hasOtpremnica ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
                Otpremnica
              </span>
            </div>
          </div>

          <div v-if="attachments.length === 0" class="empty">Još nema priloženih dokumenata.</div>

          <ul v-else class="file-list">
            <li v-for="att in attachments" :key="att.id_attachment" class="file-item">
              <div class="file-icon">
                <q-icon :name="fileIcon(att.file_type)" size="18px" />
              </div>
              <div class="file-info">
                <div class="file-name">{{ att.file_name }}</div>
                <div class="file-meta">
                  <span class="doc-tag" :class="`doc-tag--${att.document_type === 'Ponuda' ? 'offer' : 'delivery'}`">
                    {{ att.document_type }}
                  </span>
                  <span class="muted">{{ att.uploaded_by }} · {{ formatDate(att.uploaded_at) }}</span>
                </div>
              </div>
              <div class="file-actions">
                <button class="icon-btn" @click="downloadAttachment(att)">
                  <q-icon name="download" size="16px" />
                  <q-tooltip>Preuzmi</q-tooltip>
                </button>
                <button v-if="canDeleteFile(att)" class="icon-btn icon-btn--danger" @click="deleteAttachment(att)">
                  <q-icon name="delete" size="16px" />
                  <q-tooltip>Obriši</q-tooltip>
                </button>
              </div>
            </li>
          </ul>

          <!-- Upload area -->
          <div v-if="canUploadAny" class="upload-section">
            <div class="upload-section__title">Dodaj dokument</div>
            <div class="upload-row">
              <q-select
                v-if="allowedDocumentTypes.length > 1"
                v-model="uploadForm.document_type"
                :options="allowedDocumentTypes"
                label="Tip dokumenta"
                outlined
                dense
                class="upload-field"
              />
              <div v-else class="upload-fixed-type">
                {{ allowedDocumentTypes[0] }}
              </div>

              <q-file
                v-model="uploadForm.file"
                label="Odaberi datoteku"
                outlined
                dense
                clearable
                class="upload-field upload-field--file"
              >
                <template #prepend><q-icon name="attach_file" size="16px" /></template>
              </q-file>

              <button
                class="btn btn--primary upload-btn"
                :disabled="!uploadForm.file || !effectiveDocumentType || uploading"
                @click="uploadAttachment"
              >
                <q-spinner v-if="uploading" size="14px" />
                <q-icon v-else name="upload" size="16px" />
                Učitaj
              </button>
            </div>
            <div v-if="uploadHint" class="upload-hint">{{ uploadHint }}</div>
          </div>
        </div>

        <!-- TIMELINE -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Povijest aktivnosti</h2>
          </div>
          <div v-if="history.length === 0" class="empty">Nema zapisa povijesti.</div>
          <ol v-else class="timeline">
            <li
              v-for="entry in history"
              :key="entry.id_request_status_history"
              class="timeline-item"
              :class="`timeline-item--${timelineKind(entry)}`"
            >
              <div class="timeline-dot">
                <q-icon :name="timelineIcon(entry)" size="12px" />
              </div>
              <div class="timeline-content">
                <div class="timeline-title">{{ timelineTitle(entry) }}</div>
                <div class="timeline-meta">{{ entry.changed_by }} · {{ formatDate(entry.changed_at) }}</div>
                <div v-if="entry.comment" class="timeline-comment">{{ entry.comment }}</div>
              </div>
            </li>
          </ol>
        </div>
      </div>

      <!-- 404 -->
      <div v-else class="empty text-center">Zahtjev nije pronađen.</div>
    </div>

    <!-- Action dialog -->
    <q-dialog v-model="actionDialog" persistent>
      <q-card class="dialog-card">
        <div class="dialog-header">
          <div class="dialog-title">{{ dialogTitle }}</div>
          <div class="dialog-desc">{{ dialogDescription }}</div>
        </div>
        <div class="dialog-body">
          <q-input
            v-model="actionComment"
            type="textarea"
            outlined
            :label="dialogInputLabel"
            rows="4"
            :disable="submittingAction"
            autofocus
          />
        </div>
        <div class="dialog-actions">
          <button class="btn btn--ghost" :disabled="submittingAction" @click="closeActionDialog">
            Odustani
          </button>
          <button
            class="btn"
            :class="dialogConfirmClass"
            :disabled="submittingAction"
            @click="confirmAction"
          >
            <q-spinner v-if="submittingAction" size="14px" />
            <q-icon v-else :name="dialogConfirmIcon" size="16px" />
            {{ dialogConfirmLabel }}
          </button>
        </div>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

/* ───────── Status konstante (moraju odgovarati backendu) ───────── */
const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};
const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];

/* Pravila uploada po statusu — moraju odgovarati attachmentRoutes.js */
const UPLOAD_RULES = {
  Ponuda: [STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO],
  Otpremnica: [STATUS.NARUCENO],
};

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const request = ref(null);
const items = ref([]);
const history = ref([]);
const attachments = ref([]);

const uploading = ref(false);
const uploadForm = ref({ document_type: null, file: null });

const actionDialog = ref(false);
const pendingAction = ref(null);
const actionComment = ref('');
const submittingAction = ref(false);

const currentUser = ref(null);

/* ───────── Computed states ───────── */

const isAdmin = computed(() => currentUser.value?.role_name === 'Administrator');
const status = computed(() => request.value?.fk_request_status);

const hasPonuda = computed(() => attachments.value.some((a) => a.document_type === 'Ponuda'));
const hasOtpremnica = computed(() => attachments.value.some((a) => a.document_type === 'Otpremnica'));
const canCloseRequest = computed(() => hasPonuda.value && hasOtpremnica.value);

const canEdit = computed(() => {
  if (!status.value) return false;
  if (LOCKED_STATUSES.includes(status.value)) return false;
  if (isAdmin.value) return true;
  // Zaposlenik može uređivati samo svoj zahtjev kad je vraćen — server validira creator
  return status.value === STATUS.VRACENO;
});

const canTakeOver = computed(() => isAdmin.value && status.value === STATUS.POSLANO);
const canDecide = computed(() => isAdmin.value && status.value === STATUS.NA_ODOBRENJU);
const canResubmit = computed(() => !isAdmin.value && status.value === STATUS.VRACENO);
const canFinish = computed(() => isAdmin.value && status.value === STATUS.NARUCENO);

/* Upload — koji su tipovi dozvoljeni za trenutni status */
const allowedDocumentTypes = computed(() => {
  if (!status.value) return [];
  return Object.entries(UPLOAD_RULES)
    .filter(([, allowed]) => allowed.includes(status.value))
    .map(([type]) => type);
});
const canUploadAny = computed(() => allowedDocumentTypes.value.length > 0);
const effectiveDocumentType = computed(() => {
  if (allowedDocumentTypes.value.length === 1) return allowedDocumentTypes.value[0];
  return uploadForm.value.document_type;
});
const uploadHint = computed(() => {
  if (!status.value) return '';
  if (status.value === STATUS.NARUCENO) return 'U ovoj fazi može se učitati otpremnica.';
  if ([STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO].includes(status.value)) {
    return 'U ovoj fazi može se učitati ponuda.';
  }
  return '';
});

const canDeleteFile = (att) => {
  if (LOCKED_STATUSES.includes(status.value)) return false;
  return isAdmin.value || att.fk_uploaded_by_user === currentUser.value?.id_user;
};

/* ───────── Dialog helperi ───────── */

const dialogTitle = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Odobravanje zahtjeva';
    case 'odbij': return 'Odbijanje zahtjeva';
    case 'vrati-na-izmjenu': return 'Vraćanje na izmjenu';
    default: return 'Akcija nad zahtjevom';
  }
});
const dialogDescription = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Komentar je neobavezan, ali preporučen.';
    case 'odbij': return 'Komentar je obavezan pri odbijanju zahtjeva.';
    case 'vrati-na-izmjenu': return 'Komentar je obavezan kako bi podnositelj znao što treba ispraviti.';
    default: return '';
  }
});
const dialogInputLabel = computed(() =>
  pendingAction.value === 'odobri' ? 'Komentar (neobavezno)' : 'Komentar *'
);
const dialogConfirmClass = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'btn--primary';
    case 'vrati-na-izmjenu': return 'btn--warning';
    case 'odbij': return 'btn--danger';
    default: return 'btn--primary';
  }
});
const dialogConfirmIcon = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'check';
    case 'vrati-na-izmjenu': return 'undo';
    case 'odbij': return 'close';
    default: return '';
  }
});
const dialogConfirmLabel = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Odobri';
    case 'vrati-na-izmjenu': return 'Vrati na izmjenu';
    case 'odbij': return 'Odbij';
    default: return 'Potvrdi';
  }
});

/* ───────── API pozivi ───────── */

const fetchRequestDetails = async () => {
  loading.value = true;
  try {
    const [detailsRes, attachmentsRes] = await Promise.all([
      api.get(`/requests/${route.params.id}`),
      api.get(`/requests/${route.params.id}/attachments`),
    ]);
    request.value = detailsRes.data.request;
    items.value = detailsRes.data.items || [];
    history.value = detailsRes.data.history || [];
    attachments.value = Array.isArray(attachmentsRes.data) ? attachmentsRes.data : [];
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri dohvaćanju zahtjeva.',
    });
    request.value = null;
  } finally {
    loading.value = false;
  }
};

const uploadAttachment = async () => {
  const docType = effectiveDocumentType.value;
  if (!uploadForm.value.file || !docType) return;

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', uploadForm.value.file);
  formData.append('document_type', docType);

  try {
    await api.post(`/requests/${route.params.id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    $q.notify({ type: 'positive', message: `${docType} uspješno dodana.` });
    uploadForm.value = { document_type: null, file: null };
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri uploadu.',
    });
  } finally {
    uploading.value = false;
  }
};

const downloadAttachment = async (att) => {
  try {
    const response = await api.get(`/attachments/download/${att.id_attachment}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', att.file_name);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri preuzimanju datoteke.' });
  }
};

const deleteAttachment = (att) => {
  $q.dialog({
    title: 'Brisanje dokumenta',
    message: `Obrisati "${att.file_name}"?`,
    cancel: { flat: true, label: 'Odustani' },
    ok: { color: 'negative', label: 'Obriši', unelevated: true },
  }).onOk(async () => {
    try {
      await api.delete(`/attachments/delete/${att.id_attachment}`);
      $q.notify({ type: 'positive', message: 'Dokument obrisan.' });
      await fetchRequestDetails();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Greška pri brisanju.',
      });
    }
  });
};

/* Generička jednoklik akcija (preuzmi, resubmit, zavrsi) — bez dijaloga */
const quickAction = async (action) => {
  submittingAction.value = true;
  try {
    await api.patch(`/requests/${route.params.id}/status`, { action });
    const messages = {
      preuzmi: 'Zahtjev preuzet na obradu.',
      resubmit: 'Zahtjev je ponovno poslan.',
      zavrsi: 'Zahtjev je označen kao završen.',
    };
    $q.notify({ type: 'positive', message: messages[action] || 'Akcija izvršena.' });
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri izvršavanju akcije.',
    });
  } finally {
    submittingAction.value = false;
  }
};

/* Dijaloška akcija (odobri, odbij, vrati-na-izmjenu) */
const openActionDialog = (action) => {
  pendingAction.value = action;
  actionComment.value = '';
  actionDialog.value = true;
};
const closeActionDialog = () => {
  actionDialog.value = false;
  pendingAction.value = null;
  actionComment.value = '';
};
const confirmAction = async () => {
  const requiresComment = ['odbij', 'vrati-na-izmjenu'].includes(pendingAction.value);
  if (requiresComment && !actionComment.value.trim()) {
    $q.notify({ type: 'negative', message: 'Komentar je obavezan za ovu akciju.' });
    return;
  }
  submittingAction.value = true;
  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: pendingAction.value,
      comment: actionComment.value.trim() || null,
    });
    $q.notify({ type: 'positive', message: 'Status zahtjeva ažuriran.' });
    closeActionDialog();
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri promjeni statusa.',
    });
  } finally {
    submittingAction.value = false;
  }
};

const editRequest = () => router.push(`/requests/${route.params.id}/edit`);
const goBack = () => router.push('/requests');

/* ───────── Formatters ───────── */

const formatCurrency = (value) => {
  if (value == null) return '—';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};
const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusClass = (statusId) => {
  switch (statusId) {
    case STATUS.POSLANO: return 'status--sent';
    case STATUS.NA_ODOBRENJU: return 'status--review';
    case STATUS.VRACENO: return 'status--returned';
    case STATUS.ODBIJENO: return 'status--rejected';
    case STATUS.NARUCENO: return 'status--ordered';
    case STATUS.ZATVORENO: return 'status--closed';
    default: return 'status--default';
  }
};

const timelineKind = (entry) => {
  if (entry.comment?.startsWith('Dokument dodan')) return 'doc-add';
  if (entry.comment?.startsWith('Dokument obrisan')) return 'doc-del';
  if (entry.comment?.startsWith('Zahtjev izmijenjen')) return 'edit';
  return `s-${entry.fk_request_status}`;
};
const timelineIcon = (entry) => {
  if (entry.comment?.startsWith('Dokument dodan')) return 'attach_file';
  if (entry.comment?.startsWith('Dokument obrisan')) return 'delete';
  if (entry.comment?.startsWith('Zahtjev izmijenjen')) return 'edit';
  switch (entry.fk_request_status) {
    case STATUS.POSLANO: return 'outbox';
    case STATUS.NA_ODOBRENJU: return 'pending';
    case STATUS.VRACENO: return 'undo';
    case STATUS.ODBIJENO: return 'close';
    case STATUS.NARUCENO: return 'check';
    case STATUS.ZATVORENO: return 'task_alt';
    default: return 'circle';
  }
};
const timelineTitle = (entry) => {
  if (entry.comment?.startsWith('Dokument dodan')) return 'Dokument dodan';
  if (entry.comment?.startsWith('Dokument obrisan')) return 'Dokument obrisan';
  if (entry.comment?.startsWith('Zahtjev izmijenjen')) return 'Zahtjev izmijenjen';
  return entry.status_name;
};

const fileIcon = (mimeType) => {
  if (!mimeType) return 'insert_drive_file';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'table_chart';
  if (mimeType.includes('zip')) return 'folder_zip';
  return 'insert_drive_file';
};

onMounted(() => {
  currentUser.value = getStoredUser();
  fetchRequestDetails();
});
</script>

<style scoped>
/* ───────── Tokens ───────── */
.page {
  --bg: #FAFAFA;
  --surface: #FFFFFF;
  --border: rgba(0, 0, 0, 0.08);
  --border-strong: rgba(0, 0, 0, 0.14);
  --text: #111111;
  --text-muted: #6B6B70;
  --text-faint: #9A9AA1;
  --accent: #00AFDB;
  --accent-hover: #0098C0;
  --danger: #D92D20;
  --warning: #B54708;
  --success: #15803D;
  --radius: 12px;
  --radius-sm: 8px;

  background: var(--bg);
  min-height: 100vh;
  padding: 32px 24px 64px;
  font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
  color: var(--text);
}

.shell {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ───────── Back link ───────── */
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 6px 0;
  font-size: 0.8125rem;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s;
  width: fit-content;
}
.back-link:hover { color: var(--text); }

/* ───────── Loading ───────── */
.loading-state {
  display: flex;
  justify-content: center;
  padding: 64px 0;
}

/* ───────── Header ───────── */
.page-header {
  margin-bottom: 8px;
}
.eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  text-transform: uppercase;
}
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.title {
  font-size: 1.625rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--text);
}
.spacer { flex: 1; }
.meta {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 4px;
}

/* ───────── Status pill ───────── */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
}
.status-pill--sm {
  padding: 2px 8px;
  font-size: 0.6875rem;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: currentColor;
  opacity: 0.8;
}
.status--sent     { background: #EEF2FF; color: #3730A3; }
.status--review   { background: #ECFEFF; color: #155E75; }
.status--returned { background: #FFF7ED; color: #9A3412; }
.status--rejected { background: #FEF2F2; color: #991B1B; }
.status--ordered  { background: #F5F3FF; color: #5B21B6; }
.status--closed   { background: #F0FDF4; color: #166534; }
.status--default  { background: #F5F5F5; color: #525252; }

/* ───────── Buttons ───────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn--primary {
  background: #16294E;
  color: white;
}
.btn--primary:hover:not(:disabled) { background: #0F1F3D; }
.btn--ghost {
  background: var(--surface);
  color: var(--text);
  border-color: var(--border-strong);
}
.btn--ghost:hover:not(:disabled) { background: #F5F5F5; }
.btn--danger {
  background: var(--surface);
  color: var(--danger);
  border-color: rgba(217, 45, 32, 0.3);
}
.btn--danger:hover:not(:disabled) {
  background: #FEF2F2;
  border-color: var(--danger);
}
.btn--warning {
  background: var(--surface);
  color: var(--warning);
  border-color: rgba(181, 71, 8, 0.3);
}
.btn--warning:hover:not(:disabled) {
  background: #FFF7ED;
  border-color: var(--warning);
}

.ghost-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: 1px solid var(--border-strong);
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}
.ghost-btn:hover { background: #F5F5F5; }

/* ───────── Action cards ───────── */
.action-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 20px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--surface);
  flex-wrap: wrap;
}
.action-card--neutral { border-left: 3px solid var(--accent); }
.action-card--decision { border-left: 3px solid #B54708; background: #FFFBF5; }
.action-card--info { border-left: 3px solid #155E75; background: #F8FEFF; }
.action-card--success { border-left: 3px solid #15803D; background: #F8FFFB; }

.action-card__body { flex: 1; min-width: 220px; }
.action-card__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 2px;
}
.action-card__desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  line-height: 1.5;
}
.action-card__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--warning);
}
.action-card__btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* ───────── Cards ───────── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  letter-spacing: -0.01em;
}
.badge {
  font-size: 0.75rem;
  color: var(--text-faint);
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 999px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 768px) {
  .grid { grid-template-columns: 1fr; }
}

/* ───────── Info list ───────── */
.info-list {
  margin: 0;
  padding: 0;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.8125rem;
}
.info-row:last-child { border-bottom: none; }
.info-row dt {
  color: var(--text-muted);
  margin: 0;
}
.info-row dd {
  color: var(--text);
  font-weight: 500;
  margin: 0;
  text-align: right;
}

.prose {
  font-size: 0.875rem;
  color: var(--text);
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* ───────── Items table ───────── */
.items-table {
  width: 100%;
  border-collapse: collapse;
}
.items-table thead th {
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 8px 12px 8px 0;
  border-bottom: 1px solid var(--border);
}
.items-table tbody td {
  font-size: 0.875rem;
  color: var(--text);
  padding: 12px 12px 12px 0;
  border-bottom: 1px solid var(--border);
}
.items-table tbody tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.muted { color: var(--text-muted); }
.mono { font-variant-numeric: tabular-nums; font-weight: 500; }

/* ───────── Documents ───────── */
.doc-indicators {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.doc-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  background: #F5F5F5;
  color: var(--text-faint);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border);
}
.doc-indicator--ok {
  background: #F0FDF4;
  color: #166534;
  border-color: rgba(21, 128, 61, 0.2);
}

.file-list {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
}
.file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.file-item:last-child { border-bottom: none; }
.file-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  flex-shrink: 0;
}
.file-info { flex: 1; min-width: 0; }
.file-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.doc-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
}
.doc-tag--offer    { background: #EEF2FF; color: #3730A3; }
.doc-tag--delivery { background: #F0FDF4; color: #166534; }

.file-actions { display: flex; gap: 4px; }
.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.icon-btn:hover {
  background: #F5F5F5;
  color: var(--text);
}
.icon-btn--danger:hover {
  background: #FEF2F2;
  color: var(--danger);
}

/* ───────── Upload section ───────── */
.upload-section {
  border-top: 1px solid var(--border);
  margin-top: 8px;
  padding-top: 16px;
}
.upload-section__title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 10px;
}
.upload-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  flex-wrap: wrap;
}
.upload-field { flex: 1; min-width: 180px; }
.upload-field--file { flex: 2; min-width: 220px; }
.upload-fixed-type {
  display: flex;
  align-items: center;
  padding: 0 14px;
  background: #F5F5F5;
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
}
.upload-btn { align-self: stretch; }
.upload-hint {
  font-size: 0.75rem;
  color: var(--text-faint);
  margin-top: 8px;
}

/* ───────── Timeline ───────── */
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  position: relative;
}
.timeline-item {
  display: flex;
  gap: 12px;
  padding: 8px 0 16px;
  position: relative;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 28px;
  bottom: 0;
  width: 1px;
  background: var(--border);
}
.timeline-item:last-child::before { display: none; }

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  color: var(--text-muted);
}
.timeline-item--doc-add .timeline-dot { background: #F0FDF4; border-color: rgba(21, 128, 61, 0.3); color: #15803D; }
.timeline-item--doc-del .timeline-dot { background: #FEF2F2; border-color: rgba(217, 45, 32, 0.3); color: var(--danger); }
.timeline-item--edit .timeline-dot { background: #ECFEFF; border-color: rgba(21, 94, 117, 0.3); color: #155E75; }
.timeline-item--s-1 .timeline-dot { background: #EEF2FF; border-color: rgba(55, 48, 163, 0.3); color: #3730A3; }
.timeline-item--s-2 .timeline-dot { background: #ECFEFF; border-color: rgba(21, 94, 117, 0.3); color: #155E75; }
.timeline-item--s-3 .timeline-dot { background: #FFF7ED; border-color: rgba(154, 52, 18, 0.3); color: #9A3412; }
.timeline-item--s-5 .timeline-dot { background: #FEF2F2; border-color: rgba(217, 45, 32, 0.3); color: var(--danger); }
.timeline-item--s-6 .timeline-dot { background: #F5F3FF; border-color: rgba(91, 33, 182, 0.3); color: #5B21B6; }
.timeline-item--s-7 .timeline-dot { background: #F0FDF4; border-color: rgba(21, 128, 61, 0.3); color: #15803D; }

.timeline-content { flex: 1; min-width: 0; padding-top: 2px; }
.timeline-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text);
}
.timeline-meta {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.timeline-comment {
  margin-top: 6px;
  padding: 8px 12px;
  background: #FAFAFA;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.8125rem;
  color: var(--text);
  line-height: 1.5;
}

/* ───────── Empty ───────── */
.empty {
  font-size: 0.875rem;
  color: var(--text-faint);
  padding: 16px 0;
}
.text-center { text-align: center; padding: 64px 0; }

/* ───────── Dialog ───────── */
.dialog-card {
  min-width: 460px;
  max-width: 90vw;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
}
.dialog-header { padding: 20px 24px 12px; }
.dialog-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -0.01em;
}
.dialog-desc {
  font-size: 0.8125rem;
  color: var(--text-muted);
  margin-top: 2px;
}
.dialog-body { padding: 0 24px 16px; }
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 20px;
  border-top: 1px solid var(--border);
}

@media (max-width: 640px) {
  .page { padding: 16px 12px 48px; }
  .title { font-size: 1.4rem; }
  .action-card { flex-direction: column; align-items: stretch; }
  .action-card__btns { width: 100%; }
  .action-card__btns .btn { flex: 1; }
  .dialog-card { min-width: 0; width: 100%; }
}
</style>
