<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Back link -->
      <button class="back-link" @click="goBack">
        <q-icon name="arrow_back" size="14px" />
        <span>Natrag na zahtjeve</span>
      </button>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <!-- Content -->
      <div v-else-if="request">

        <!-- Page header -->
        <header class="page-header">
          <div class="page-header__main">
            <div class="page-header__eyebrow">Zahtjev za nabavu</div>
            <div class="page-header__title-row">
              <h1 class="page-header__title">{{ request.request_number }}</h1>
              <span class="status" :class="statusClass(request.fk_request_status)">
                {{ request.status_name }}
              </span>
            </div>
            <div class="page-header__meta">
              {{ request.created_by }} · {{ formatDate(request.created_at) }}
            </div>
          </div>
          <div class="page-header__actions">
            <button v-if="canEdit" class="btn btn--ghost" @click="editRequest">
              <q-icon name="edit" size="16px" />
              <span>Uredi</span>
            </button>
          </div>
        </header>

        <!-- Banner: Preuzmi / Odbij (status 1 → 2 ili 5) -->
        <div v-if="canTakeOver" class="action-banner action-banner--neutral">
          <div class="action-banner__icon">
            <q-icon name="assignment_turned_in" size="18px" />
          </div>
          <div class="action-banner__body">
            <div class="action-banner__title">Novi zahtjev čeka pregled</div>
            <div class="action-banner__desc">
              Preuzmite zahtjev na obradu ili ga odmah odbijte ako je očito nevaljan.
            </div>
          </div>
          <div class="action-banner__actions">
            <button class="btn btn--danger" @click="openActionDialog('odbij')">
              <q-icon name="close" size="16px" />
              <span>Odbij</span>
            </button>
            <button class="btn btn--primary" :disabled="submittingAction" @click="quickAction('preuzmi')">
              <q-spinner v-if="submittingAction" size="14px" color="white" />
              <q-icon v-else name="assignment_turned_in" size="16px" />
              <span>Preuzmi na obradu</span>
            </button>
          </div>
        </div>

        <!-- Banner: Odluka (status 2) -->
        <div v-if="canDecide" class="action-banner action-banner--warning">
          <div class="action-banner__icon">
            <q-icon name="how_to_reg" size="18px" />
          </div>
          <div class="action-banner__body">
            <div class="action-banner__title">Potrebna vaša odluka</div>
            <div class="action-banner__desc">
              Pregledajte zahtjev i odlučite hoćete li ga odobriti ili vratiti podnositelju na dopunu.
            </div>
            <div v-if="!hasPonuda" class="action-banner__hint">
              <q-icon name="info" size="14px" />
              <span>Za odobravanje je potrebna priložena ponuda.</span>
            </div>
          </div>
          <div class="action-banner__actions">
            <button class="btn btn--ghost" @click="openActionDialog('vrati-na-izmjenu')">
              <q-icon name="undo" size="16px" />
              <span>Vrati na dopunu</span>
            </button>
            <button class="btn btn--primary" :disabled="!hasPonuda" @click="openActionDialog('odobri')">
              <q-icon name="check" size="16px" />
              <span>Odobri</span>
            </button>
          </div>
        </div>

        <!-- Banner: Resubmit (status 3) -->
        <div v-if="canResubmit" class="action-banner action-banner--info">
          <div class="action-banner__icon">
            <q-icon name="edit_note" size="18px" />
          </div>
          <div class="action-banner__body">
            <div class="action-banner__title">Zahtjev je vraćen na dopunu / izmjenu</div>
            <div class="action-banner__desc">
              Pregledajte komentar administratora, uredite zahtjev i pošaljite ga ponovno.
            </div>
            <div v-if="lastReturnComment" class="return-comment">
              <div class="return-comment__label">Komentar administratora</div>
              <div class="return-comment__text">{{ lastReturnComment }}</div>
            </div>
          </div>
          <div class="action-banner__actions">
            <button class="btn btn--ghost" @click="editRequest">
              <q-icon name="edit" size="16px" />
              <span>Uredi</span>
            </button>
            <button class="btn btn--primary" :disabled="submittingAction" @click="quickAction('resubmit')">
              <q-spinner v-if="submittingAction" size="14px" color="white" />
              <q-icon v-else name="send" size="16px" />
              <span>Pošalji ponovno</span>
            </button>
          </div>
        </div>

        <!-- Banner: Završi (status 6) -->
        <div v-if="canFinish" class="action-banner action-banner--success">
          <div class="action-banner__icon">
            <q-icon name="verified" size="18px" />
          </div>
          <div class="action-banner__body">
            <div class="action-banner__title">Zahtjev je odobren</div>
            <div class="action-banner__desc">
              <span v-if="canFinishNow">
                Svi uvjeti su zadovoljeni. Zahtjev možete označiti kao završen.
              </span>
              <span v-else>
                Za završetak su potrebni: ponuda, otpremnica i upisan procijenjeni iznos.
              </span>
            </div>
            <div v-if="!canFinishNow" class="action-banner__hint">
              <q-icon name="info" size="14px" />
              <span>Nedostaje: {{ missingForFinish.join(', ') }}</span>
            </div>
          </div>
          <div class="action-banner__actions">
            <button
              class="btn btn--primary"
              :disabled="!canFinishNow || submittingAction"
              @click="quickAction('zavrsi')"
            >
              <q-spinner v-if="submittingAction" size="14px" color="white" />
              <q-icon v-else name="task_alt" size="16px" />
              <span>Označi završeno</span>
            </button>
          </div>
        </div>

        <!-- Info cards -->
        <div class="info-grid">
          <div class="card">
            <div class="card__header">
              <h2 class="card__title">
                <q-icon name="info" size="16px" />
                <span>Osnovni podaci</span>
              </h2>
            </div>
            <div class="card__body">
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
                    <span class="status status--sm" :class="statusClass(request.fk_request_status)">
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
                  <dd class="info-row__amount">{{ formatCurrency(request.total_amount) }}</dd>
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
          </div>

          <div class="card">
            <div class="card__header">
              <h2 class="card__title">
                <q-icon name="subject" size="16px" />
                <span>Svrha nabave</span>
              </h2>
            </div>
            <div class="card__body">
              <p class="prose">{{ request.justification || 'Nema unesenog obrazloženja.' }}</p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="inventory_2" size="16px" />
              <span>Stavke</span>
            </h2>
            <span class="card__count">{{ items.length }}</span>
          </div>
          <div class="card__body card__body--flush">
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
                  <td class="muted">{{ item.category_name }}</td>
                  <td class="text-right num">{{ item.quantity }}</td>
                </tr>
              </tbody>
            </table>
            <div v-else class="card__empty">Nema stavki.</div>
          </div>
        </div>

        <!-- Documents -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="folder" size="16px" />
              <span>Dokumenti</span>
            </h2>
            <div class="doc-indicators">
              <span class="doc-indicator" :class="{ 'doc-indicator--ok': hasPonuda }">
                <q-icon :name="hasPonuda ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
                <span>Ponuda</span>
              </span>
              <span class="doc-indicator" :class="{ 'doc-indicator--ok': hasOtpremnica }">
                <q-icon :name="hasOtpremnica ? 'check_circle' : 'radio_button_unchecked'" size="14px" />
                <span>Otpremnica</span>
              </span>
            </div>
          </div>

          <div class="card__body card__body--flush">
            <div v-if="attachments.length === 0" class="card__empty">
              Još nema priloženih dokumenata.
            </div>

            <ul v-else class="file-list">
              <li v-for="att in attachments" :key="att.id_attachment" class="file-row">
                <div class="file-icon">
                  <q-icon :name="fileIcon(att.file_type)" size="18px" />
                </div>
                <div class="file-info">
                  <div class="file-name">{{ att.file_name }}</div>
                  <div class="file-meta">
                    <span class="doc-tag" :class="`doc-tag--${att.document_type === 'Ponuda' ? 'offer' : 'delivery'}`">
                      {{ att.document_type }}
                    </span>
                    <span class="muted">·</span>
                    <span class="muted">{{ att.uploaded_by }} · {{ formatDate(att.uploaded_at) }}</span>
                  </div>
                </div>
                <div class="file-actions">
                  <button class="icon-btn" @click="downloadAttachment(att)">
                    <q-icon name="download" size="16px" />
                    <q-tooltip>Preuzmi</q-tooltip>
                  </button>
                  <button v-if="canDeleteFile(att)" class="icon-btn icon-btn--danger" @click="deleteAttachment(att)">
                    <q-icon name="delete_outline" size="16px" />
                    <q-tooltip>Obriši</q-tooltip>
                  </button>
                </div>
              </li>
            </ul>
          </div>

          <!-- Upload area -->
          <div v-if="canUploadAny" class="upload-section">
            <div class="upload-section__label">Dodaj dokument</div>
            <div class="upload-row">
              <q-select
                v-if="allowedDocumentTypes.length > 1"
                v-model="uploadForm.document_type"
                :options="allowedDocumentTypes"
                placeholder="Tip dokumenta"
                outlined dense
                class="upload-field upload-field--type"
              />
              <div v-else class="upload-fixed-type">
                {{ allowedDocumentTypes[0] }}
              </div>

              <q-file
                v-model="uploadForm.file"
                placeholder="Odaberi datoteku..."
                outlined dense clearable
                class="upload-field upload-field--file"
              >
                <template #prepend><q-icon name="attach_file" size="16px" /></template>
              </q-file>

              <button
                class="btn btn--primary upload-btn"
                :disabled="!uploadForm.file || !effectiveDocumentType || uploading"
                @click="uploadAttachment"
              >
                <q-spinner v-if="uploading" size="14px" color="white" />
                <q-icon v-else name="upload" size="16px" />
                <span>Učitaj</span>
              </button>
            </div>
            <div v-if="uploadHint" class="upload-hint">{{ uploadHint }}</div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="history" size="16px" />
              <span>Povijest aktivnosti</span>
            </h2>
          </div>
          <div class="card__body card__body--flush">
            <div v-if="history.length === 0" class="card__empty">
              Nema zapisa povijesti.
            </div>
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

      </div>

      <!-- 404 -->
      <div v-else class="empty-block--page">
        <q-icon name="error_outline" size="32px" class="empty-block__icon" />
        <div class="empty-block__text">Zahtjev nije pronađen.</div>
      </div>
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
            <q-spinner v-if="submittingAction" size="14px" color="white" />
            <q-icon v-else :name="dialogConfirmIcon" size="16px" />
            <span>{{ dialogConfirmLabel }}</span>
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

const STATUS = {
  POSLANO: 1,
  NA_ODOBRENJU: 2,
  VRACENO: 3,
  ODBIJENO: 5,
  NARUCENO: 6,
  ZATVORENO: 7,
};
const LOCKED_STATUSES = [STATUS.ODBIJENO, STATUS.ZATVORENO];

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

/* ───────── Computed ───────── */

const isAdmin = computed(() => currentUser.value?.role_name === 'Administrator');
const status = computed(() => request.value?.fk_request_status);

const hasPonuda = computed(() => attachments.value.some((a) => a.document_type === 'Ponuda'));
const hasOtpremnica = computed(() => attachments.value.some((a) => a.document_type === 'Otpremnica'));

const hasAmount = computed(() => {
  const v = Number(request.value?.total_amount);
  return Number.isFinite(v) && v > 0;
});
const canFinishNow = computed(() => hasPonuda.value && hasOtpremnica.value && hasAmount.value);

const missingForFinish = computed(() => {
  const missing = [];
  if (!hasPonuda.value) missing.push('ponuda');
  if (!hasOtpremnica.value) missing.push('otpremnica');
  if (!hasAmount.value) missing.push('procijenjeni iznos');
  return missing;
});

const canEdit = computed(() => {
  if (!status.value) return false;
  if (LOCKED_STATUSES.includes(status.value)) return false;
  if (isAdmin.value) return true;
  return status.value === STATUS.VRACENO;
});

const canTakeOver = computed(() => isAdmin.value && status.value === STATUS.POSLANO);
const canDecide = computed(() => isAdmin.value && status.value === STATUS.NA_ODOBRENJU);
const canResubmit = computed(() => !isAdmin.value && status.value === STATUS.VRACENO);
const canFinish = computed(() => isAdmin.value && status.value === STATUS.NARUCENO);

const lastReturnComment = computed(() => {
  const entries = history.value.filter((h) => h.fk_request_status === STATUS.VRACENO);
  if (entries.length === 0) return null;
  return entries[entries.length - 1].comment || null;
});

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
    case 'vrati-na-izmjenu': return 'Vraćanje na dopunu';
    default: return 'Akcija nad zahtjevom';
  }
});
const dialogDescription = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Komentar je neobavezan, ali preporučen.';
    case 'odbij': return 'Komentar je obavezan pri odbijanju zahtjeva.';
    case 'vrati-na-izmjenu': return 'Komentar je obavezan kako bi podnositelj znao što ispraviti.';
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
    case 'vrati-na-izmjenu': return 'Vrati na dopunu';
    case 'odbij': return 'Odbij';
    default: return 'Potvrdi';
  }
});

/* ───────── API ───────── */

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
.page {
  background: #F5F5F5;
  min-height: 100vh;
  padding: 24px 24px 64px;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #201F1E;
}

.page-shell {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 4px 0;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #605E5C;
  cursor: pointer;
  transition: color 0.15s;
  width: fit-content;
}
.back-link:hover { color: #16294E; }

.loading-block {
  display: flex;
  justify-content: center;
  padding: 48px 0;
}

/* Page header */
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.page-header__main { flex: 1; min-width: 240px; }
.page-header__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #00AFDB;
  margin-bottom: 4px;
}
.page-header__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.page-header__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #16294E;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0;
}
.page-header__meta {
  font-size: 0.8125rem;
  color: #605E5C;
  margin-top: 4px;
}
.page-header__actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  color: #201F1E;
  background: white;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary {
  background: #16294E;
  color: white;
  border-color: #16294E;
}
.btn--primary:hover:not(:disabled) { background: #0F1F3D; border-color: #0F1F3D; }
.btn--ghost {
  background: white;
  color: #424242;
  border-color: #C8C6C4;
}
.btn--ghost:hover:not(:disabled) { background: #F8F8F8; border-color: #605E5C; }
.btn--danger {
  background: white;
  color: #A4262C;
  border-color: #C8C6C4;
}
.btn--danger:hover:not(:disabled) {
  background: #FDE7E9;
  border-color: #A4262C;
}
.btn--warning {
  background: white;
  color: #B7791F;
  border-color: #C8C6C4;
}
.btn--warning:hover:not(:disabled) {
  background: #FFF4CE;
  border-color: #B7791F;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #605E5C;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover { background: #F3F2F1; color: #201F1E; }
.icon-btn--danger:hover { background: #FDE7E9; color: #A4262C; }

/* Status pills */
.status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 8px;
  border-radius: 11px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid transparent;
  white-space: nowrap;
}
.status::before {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.status--sm {
  height: 20px;
  padding: 0 7px;
  font-size: 0.625rem;
}
.status--sent     { background: #EEF2FF; color: #3730A3; border-color: #C7D2FE; }
.status--review   { background: #FFF4CE; color: #B7791F; border-color: #F2D17C; }
.status--returned { background: #FFF4ED; color: #C2410C; border-color: #FBBF77; }
.status--rejected { background: #FDE7E9; color: #A4262C; border-color: #F1B0B7; }
.status--ordered  { background: #E1F5FA; color: #00708A; border-color: #94DCEF; }
.status--closed   { background: #DFF6DD; color: #107C10; border-color: #92DDA8; }
.status--default  { background: #F8F8F8; color: #605E5C; border-color: #E1DFDD; }

/* Action banners */
.action-banner {
  background: white;
  border: 1px solid #E1DFDD;
  border-left: 3px solid #00AFDB;
  border-radius: 6px;
  padding: 14px 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  flex-wrap: wrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.action-banner--neutral { border-left-color: #00AFDB; }
.action-banner--warning { border-left-color: #B7791F; background: #FFFBF5; }
.action-banner--info    { border-left-color: #155E75; background: #F8FEFF; }
.action-banner--success { border-left-color: #107C10; background: #F8FFFB; }

.action-banner__icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #E1F5FA;
  color: #00708A;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-banner--warning .action-banner__icon { background: #FFF4CE; color: #B7791F; }
.action-banner--info .action-banner__icon { background: #E1F5FA; color: #155E75; }
.action-banner--success .action-banner__icon { background: #DFF6DD; color: #107C10; }

.action-banner__body { flex: 1; min-width: 220px; }
.action-banner__title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #201F1E;
  margin-bottom: 2px;
}
.action-banner__desc {
  font-size: 0.8125rem;
  color: #605E5C;
  line-height: 1.5;
}
.action-banner__hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 0.75rem;
  color: #B7791F;
}
.action-banner__actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-self: flex-start;
}

.return-comment {
  margin-top: 10px;
  padding: 10px 12px;
  background: white;
  border: 1px solid #FDD9A6;
  border-radius: 4px;
}
.return-comment__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #B7791F;
  margin-bottom: 4px;
}
.return-comment__text {
  font-size: 0.8125rem;
  color: #201F1E;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* Cards */
.card {
  background: white;
  border: 1px solid #E1DFDD;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #E1DFDD;
}
.card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #201F1E;
  margin: 0;
}
.card__title .q-icon { color: #00AFDB; }
.card__count {
  font-size: 0.6875rem;
  font-weight: 500;
  color: #605E5C;
  background: #F8F8F8;
  padding: 2px 8px;
  border-radius: 10px;
  border: 1px solid #E1DFDD;
}
.card__body { padding: 16px; }
.card__body--flush { padding: 0; }
.card__empty {
  padding: 24px 16px;
  text-align: center;
  font-size: 0.8125rem;
  color: #8A8886;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 800px) {
  .info-grid { grid-template-columns: 1fr; }
}

.info-list { margin: 0; padding: 0; }
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #E1DFDD;
  font-size: 0.8125rem;
}
.info-row:last-child { border-bottom: none; }
.info-row dt { color: #605E5C; margin: 0; }
.info-row dd { color: #201F1E; font-weight: 500; margin: 0; text-align: right; }
.info-row__amount { font-variant-numeric: tabular-nums; }

.prose {
  font-size: 0.8125rem;
  color: #201F1E;
  line-height: 1.6;
  margin: 0;
  white-space: pre-wrap;
}

/* Items table */
.items-table {
  width: 100%;
  border-collapse: collapse;
}
.items-table thead th {
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8A8886;
  background: #F8F8F8;
  padding: 8px 16px;
  border-bottom: 1px solid #E1DFDD;
}
.items-table tbody td {
  padding: 10px 16px;
  font-size: 0.8125rem;
  color: #201F1E;
  border-bottom: 1px solid #E1DFDD;
}
.items-table tbody tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.muted { color: #605E5C; }
.num { font-variant-numeric: tabular-nums; font-weight: 500; }

/* Documents */
.doc-indicators {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.doc-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  height: 22px;
  border-radius: 11px;
  font-size: 0.6875rem;
  font-weight: 500;
  background: #F8F8F8;
  color: #8A8886;
  border: 1px solid #E1DFDD;
}
.doc-indicator--ok {
  background: #DFF6DD;
  color: #107C10;
  border-color: #92DDA8;
}

.file-list { list-style: none; padding: 0; margin: 0; }
.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #E1DFDD;
  transition: background 0.12s;
}
.file-row:hover { background: #FAFAFA; }
.file-row:last-child { border-bottom: none; }

.file-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #E8EBF1;
  color: #16294E;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-info { flex: 1; min-width: 0; }
.file-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #201F1E;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: 0.6875rem;
  color: #605E5C;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.doc-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.doc-tag--offer    { background: #EEF2FF; color: #3730A3; }
.doc-tag--delivery { background: #DFF6DD; color: #107C10; }
.file-actions { display: flex; gap: 2px; }

/* Upload */
.upload-section {
  padding: 14px 16px;
  background: #F8F8F8;
  border-top: 1px solid #E1DFDD;
}
.upload-section__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8A8886;
  margin-bottom: 8px;
}
.upload-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
  flex-wrap: wrap;
}
.upload-field { flex: 1; min-width: 160px; }
.upload-field--type { flex: 0 0 180px; }
.upload-field--file { flex: 2; min-width: 220px; }
.upload-field :deep(.q-field__control) {
  height: 32px;
  border-radius: 4px;
  background: white;
}
.upload-field :deep(.q-field__native),
.upload-field :deep(.q-field__input) { font-size: 0.8125rem; }

.upload-fixed-type {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: white;
  border: 1px solid #C8C6C4;
  border-radius: 4px;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #201F1E;
  white-space: nowrap;
  height: 32px;
}
.upload-btn { height: 32px; }
.upload-hint {
  font-size: 0.75rem;
  color: #8A8886;
  margin-top: 8px;
}

/* Timeline */
.timeline {
  list-style: none;
  margin: 0;
  padding: 12px 16px;
  position: relative;
}
.timeline-item {
  display: flex;
  gap: 12px;
  padding: 6px 0 14px;
  position: relative;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: 11px;
  top: 28px;
  bottom: 0;
  width: 1px;
  background: #E1DFDD;
}
.timeline-item:last-child::before { display: none; }

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #C8C6C4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  color: #605E5C;
  margin-top: 2px;
}
.timeline-item--doc-add .timeline-dot { background: #DFF6DD; border-color: #92DDA8; color: #107C10; }
.timeline-item--doc-del .timeline-dot { background: #FDE7E9; border-color: #F1B0B7; color: #A4262C; }
.timeline-item--edit .timeline-dot { background: #E1F5FA; border-color: #94DCEF; color: #155E75; }
.timeline-item--s-1 .timeline-dot { background: #EEF2FF; border-color: #C7D2FE; color: #3730A3; }
.timeline-item--s-2 .timeline-dot { background: #FFF4CE; border-color: #F2D17C; color: #B7791F; }
.timeline-item--s-3 .timeline-dot { background: #FFF4ED; border-color: #FBBF77; color: #C2410C; }
.timeline-item--s-5 .timeline-dot { background: #FDE7E9; border-color: #F1B0B7; color: #A4262C; }
.timeline-item--s-6 .timeline-dot { background: #E1F5FA; border-color: #94DCEF; color: #00708A; }
.timeline-item--s-7 .timeline-dot { background: #DFF6DD; border-color: #92DDA8; color: #107C10; }

.timeline-content { flex: 1; min-width: 0; padding-top: 2px; }
.timeline-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #201F1E;
}
.timeline-meta {
  font-size: 0.75rem;
  color: #605E5C;
  margin-top: 1px;
}
.timeline-comment {
  margin-top: 6px;
  padding: 8px 12px;
  background: #FAFAFA;
  border: 1px solid #E1DFDD;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: #201F1E;
  line-height: 1.5;
}

/* Empty */
.empty-block--page {
  text-align: center;
  padding: 56px 24px;
  background: white;
  border-radius: 6px;
  border: 1px solid #E1DFDD;
}
.empty-block__icon { color: #A19F9D; margin-bottom: 8px; }
.empty-block__text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #424242;
}

/* Dialog */
.dialog-card {
  min-width: 460px;
  max-width: 90vw;
  border-radius: 6px;
  overflow: hidden;
  background: white;
  border: 1px solid #E1DFDD;
  box-shadow:
    0 6.4px 14.4px rgba(0, 0, 0, 0.13),
    0 1.2px 3.6px rgba(0, 0, 0, 0.10);
}
.dialog-header { padding: 18px 20px 10px; }
.dialog-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #201F1E;
  letter-spacing: -0.005em;
}
.dialog-desc {
  font-size: 0.8125rem;
  color: #605E5C;
  margin-top: 3px;
}
.dialog-body { padding: 0 20px 14px; }
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 12px 20px 16px;
  border-top: 1px solid #E1DFDD;
  background: #FAFAFA;
}

@media (max-width: 600px) {
  .page { padding: 16px 12px 48px; }
  .page-header__title { font-size: 1.25rem; }
  .action-banner { flex-direction: column; align-items: stretch; }
  .action-banner__actions { width: 100%; }
  .action-banner__actions .btn { flex: 1; }
  .dialog-card { min-width: 0; width: 100%; }
}
</style>
