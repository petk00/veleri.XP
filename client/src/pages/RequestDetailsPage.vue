<template>
  <q-page class="details-page q-pa-lg">
    <div class="page-shell">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Natrag na zahtjeve"
        class="q-mb-md back-btn"
        @click="goBack"
      />

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="36px" />
      </div>

      <div v-else-if="request">
        <section class="page-hero q-mb-lg">
          <div>
            <div class="page-eyebrow">ZAHTJEV ZA NABAVU</div>
            <div class="header-row q-mt-sm">
              <div class="page-title">{{ request.request_number }}</div>
              <q-chip dense class="status-chip" :class="statusClass(request.status_name)">
                {{ request.status_name }}
              </q-chip>
              <q-btn
                v-if="canEdit"
                flat
                no-caps
                color="primary"
                icon="edit"
                label="Uredi"
                @click="editRequest"
              />
            </div>
            <div class="page-meta q-mt-xs">
              Kreirao {{ request.created_by }} · {{ formatDate(request.created_at) }}
            </div>
          </div>
        </section>

        <!-- Approve/Reject banner -->
        <div v-if="canApproveOrReject" class="action-banner action-banner--warning q-mb-lg">
          <div class="action-banner__info">
            <div class="action-banner__title">Potrebna vaša odluka</div>
            <div class="action-banner__desc">
              Zahtjev čeka odobrenje. Možete ga odobriti, odbiti ili vratiti na izmjenu.
            </div>
            <div v-if="!canApprove" class="action-banner__error">
              Nedostaje —
              <span v-if="!hasPonuda"> ponuda</span>
              <span v-if="!hasPonuda && (request?.total_amount == null || Number(request?.total_amount) <= 0)">,</span>
              <span v-if="request?.total_amount == null || Number(request?.total_amount) <= 0"> procijenjeni iznos</span>
            </div>
          </div>
          <div class="action-banner__btns">
            <q-btn unelevated no-caps color="warning" icon="undo" label="Vrati na izmjenu" @click="openActionDialog('return-for-revision')" />
            <q-btn unelevated no-caps color="negative" icon="close" label="Odbij" @click="openActionDialog('reject')" />
            <q-btn unelevated no-caps color="positive" icon="check" label="Odobri" :disable="!canApprove" @click="openActionDialog('approve')" />
          </div>
        </div>

        <!-- Resubmit banner -->
        <div v-if="canUserResubmit" class="action-banner action-banner--info q-mb-lg">
          <div class="action-banner__info">
            <div class="action-banner__title">Zahtjev je vraćen na izmjenu</div>
            <div class="action-banner__desc">
              Uredite zahtjev prema komentaru administratora i pošaljite ga ponovno.
            </div>
          </div>
          <div class="action-banner__btns">
            <q-btn flat no-caps color="primary" icon="edit" label="Uredi zahtjev" @click="editRequest" />
            <q-btn unelevated no-caps color="primary" icon="send" label="Ponovno pošalji" :loading="submittingAction" @click="resubmitRequest" />
          </div>
        </div>

        <!-- Complete banner -->
        <div v-if="canComplete" class="action-banner action-banner--success q-mb-lg">
          <div class="action-banner__info">
            <div class="action-banner__desc">
              <span v-if="!canCloseRequest" class="action-banner__error">Nedostaje — otpremnica</span>
              <span v-else>Svi dokumenti su priloženi. Zahtjev možete označiti kao završen.</span>
            </div>
          </div>
          <q-btn
            unelevated no-caps color="primary"
            icon="task_alt" label="Označi završeno"
            :disable="!canCloseRequest"
            :loading="submittingComplete"
            @click="completeRequest"
          />
        </div>

        <!-- Info cards -->
        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-md-6">
            <div class="info-card">
              <div class="info-card__title">Osnovni podaci</div>
              <div class="info-row"><span>Fiskalna godina</span><strong>{{ request.fiscal_year }}</strong></div>
              <div class="info-row"><span>Odjel / Služba / Projekt</span><strong>{{ request.department_name }}</strong></div>
              <div class="info-row">
                <span>Status</span>
                <q-chip dense class="status-chip" :class="statusClass(request.status_name)">
                  {{ request.status_name }}
                </q-chip>
              </div>
              <div class="info-row"><span>Zahtjev podnio</span><strong>{{ request.created_by }}</strong></div>
              <div class="info-row"><span>Procijenjeni iznos</span><strong>{{ formatCurrency(request.total_amount) }}</strong></div>
              <div class="info-row"><span>Datum kreiranja</span><strong>{{ formatDate(request.created_at) }}</strong></div>
              <div v-if="request.updated_at" class="info-row"><span>Zadnja izmjena</span><strong>{{ formatDate(request.updated_at) }}</strong></div>
            </div>
          </div>

          <div class="col-12 col-md-6">
            <div class="info-card">
              <div class="info-card__title">Svrha nabave</div>
              <div class="justification-text">{{ request.justification || 'Nema svrhe nabave.' }}</div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="info-card q-mb-lg">
          <div class="info-card__header">
            <div class="info-card__title">Stavke zahtjeva</div>
            <div class="info-card__count">Ukupno: {{ items.length }}</div>
          </div>
          <q-table
            :rows="items"
            :columns="itemsColumns"
            row-key="id_purchase_request_item"
            flat
            hide-bottom
            :pagination="{ rowsPerPage: 0 }"
            class="items-table"
          />
        </div>

        <!-- Documents -->
        <div class="info-card q-mb-lg">
          <div class="info-card__header">
            <div class="info-card__title">Dokumenti</div>
            <div class="row q-gutter-xs">
              <q-chip
                dense
                :color="hasPonuda ? 'positive' : 'grey-4'"
                :text-color="hasPonuda ? 'white' : 'grey-7'"
                icon="description"
              >Ponuda</q-chip>
              <q-chip
                dense
                :color="hasOtpremnica ? 'positive' : 'grey-4'"
                :text-color="hasOtpremnica ? 'white' : 'grey-7'"
                icon="local_shipping"
              >Otpremnica</q-chip>
            </div>
          </div>

          <div v-if="attachments.length === 0" class="empty-state">
            Još nema priloženih dokumenata.
          </div>

          <q-list v-else separator class="attachments-list q-mb-md">
            <q-item v-for="att in attachments" :key="att.id_attachment">
              <q-item-section avatar>
                <q-icon :name="fileIcon(att.file_type)" color="primary" size="24px" />
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium" style="font-size: 0.875rem;">{{ att.file_name }}</q-item-label>
                <q-item-label caption>
                  <q-badge
                    :color="att.document_type === 'Ponuda' ? 'blue-2' : 'green-2'"
                    :text-color="att.document_type === 'Ponuda' ? 'blue-9' : 'green-9'"
                  >{{ att.document_type }}</q-badge>
                  · {{ att.uploaded_by }} · {{ formatDate(att.uploaded_at) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn flat round dense icon="download" color="primary" @click="downloadAttachment(att)">
                    <q-tooltip>Preuzmi</q-tooltip>
                  </q-btn>
                  <q-btn v-if="isAdmin" flat round dense icon="delete" color="negative" @click="deleteAttachment(att)">
                    <q-tooltip>Obriši</q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </q-item>
          </q-list>

          <q-separator class="q-mb-md" color="grey-2" />

          <div class="upload-section-label">Dodaj dokument</div>
          <div class="row q-col-gutter-md items-end">
            <div class="col-12 col-md-4">
              <q-select
                v-model="uploadForm.document_type"
                :options="['Ponuda', 'Otpremnica']"
                label="Tip dokumenta"
                outlined
                dense
              />
            </div>
            <div class="col-12 col-md-6">
              <q-file v-model="uploadForm.file" label="Odaberi fajl" outlined dense clearable>
                <template #prepend><q-icon name="attach_file" /></template>
              </q-file>
            </div>
            <div class="col-12 col-md-2">
              <q-btn
                unelevated
                no-caps
                color="primary"
                icon="upload"
                label="Upload"
                class="full-width upload-btn"
                :loading="uploading"
                :disable="!uploadForm.file || !uploadForm.document_type"
                @click="uploadAttachment"
              />
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="info-card">
          <div class="info-card__title">Povijest aktivnosti</div>
          <div v-if="history.length === 0" class="empty-state">Još nema zapisa povijesti.</div>
          <q-timeline v-else color="primary" class="q-mt-md">
            <q-timeline-entry
              v-for="entry in history"
              :key="entry.id_request_status_history"
              :title="timelineTitle(entry)"
              :subtitle="`${entry.changed_by} · ${formatDate(entry.changed_at)}`"
              :color="timelineColor(timelineTitle(entry))"
              :icon="timelineIcon(timelineTitle(entry))"
            >
              <div v-if="entry.comment" class="timeline-comment">{{ entry.comment }}</div>
            </q-timeline-entry>
          </q-timeline>
        </div>
      </div>

      <div v-else class="empty-state q-pa-xl text-center">Zahtjev nije pronađen.</div>
    </div>

    <q-dialog v-model="actionDialog" persistent>
      <q-card style="min-width: 450px; max-width: 90vw; border-radius: 12px;">
        <q-card-section>
          <div class="dialog-title">{{ actionDialogTitle }}</div>
          <div class="dialog-desc q-mt-xs">{{ actionDialogDescription }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="actionComment"
            type="textarea"
            outlined
            :label="actionDialogInputLabel"
            rows="4"
            :disable="submittingAction"
            autofocus
          />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Odustani" :disable="submittingAction" @click="closeActionDialog" />
          <q-btn
            unelevated
            no-caps
            :color="actionDialogButtonColor"
            :icon="actionDialogButtonIcon"
            :label="actionDialogButtonLabel"
            :loading="submittingAction"
            style="border-radius: 6px;"
            @click="confirmAction"
          />
        </q-card-actions>
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
const submittingComplete = ref(false);

const currentUser = ref(null);

const isAdmin = computed(() => currentUser.value?.role_name === 'Administrator');
const canEdit = computed(() => isAdmin.value && !['Odbijeno', 'Zatvoreno'].includes(request.value?.status_name));
const hasPonuda = computed(() => attachments.value.some((a) => a.document_type === 'Ponuda'));
const hasOtpremnica = computed(() => attachments.value.some((a) => a.document_type === 'Otpremnica'));
const canApprove = computed(() => hasPonuda.value && Number(request.value?.total_amount) > 0);
const canApproveOrReject = computed(() => isAdmin.value && request.value?.status_name === 'Na odobrenju');
const canUserResubmit = computed(() => !isAdmin.value && request.value?.status_name === 'Vraćeno na izmjenu');
const canComplete = computed(() => isAdmin.value && request.value?.status_name === 'Odobreno');
const canCloseRequest = computed(() => hasPonuda.value && hasOtpremnica.value);

const actionDialogTitle = computed(() => {
  if (pendingAction.value === 'approve') return 'Odobravanje zahtjeva';
  if (pendingAction.value === 'reject') return 'Odbijanje zahtjeva';
  if (pendingAction.value === 'return-for-revision') return 'Vraćanje na izmjenu';
  return 'Akcija nad zahtjevom';
});

const actionDialogDescription = computed(() => {
  if (pendingAction.value === 'approve') return 'Komentar je neobavezan, ali preporučen.';
  if (pendingAction.value === 'reject') return 'Komentar je obavezan pri odbijanju zahtjeva.';
  if (pendingAction.value === 'return-for-revision') return 'Komentar je obavezan kako bi korisnik znao što treba ispraviti.';
  return '';
});

const actionDialogInputLabel = computed(() => {
  if (pendingAction.value === 'approve') return 'Komentar (neobavezno)';
  return 'Komentar *';
});

const actionDialogButtonColor = computed(() => {
  if (pendingAction.value === 'approve') return 'positive';
  if (pendingAction.value === 'return-for-revision') return 'warning';
  return 'negative';
});

const actionDialogButtonIcon = computed(() => {
  if (pendingAction.value === 'approve') return 'check';
  if (pendingAction.value === 'return-for-revision') return 'undo';
  return 'close';
});

const actionDialogButtonLabel = computed(() => {
  if (pendingAction.value === 'approve') return 'Odobri';
  if (pendingAction.value === 'return-for-revision') return 'Vrati na izmjenu';
  return 'Odbij';
});

const itemsColumns = [
  { name: 'item_name', label: 'Naziv artikla', field: 'item_name', align: 'left' },
  { name: 'category_name', label: 'Kategorija', field: 'category_name', align: 'left' },
  { name: 'quantity', label: 'Količina', field: 'quantity', align: 'right' },
];

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
  if (!uploadForm.value.file || !uploadForm.value.document_type) return;

  uploading.value = true;
  const formData = new FormData();
  formData.append('file', uploadForm.value.file);
  formData.append('document_type', uploadForm.value.document_type);

  try {
    await api.post(`/requests/${route.params.id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    $q.notify({ type: 'positive', message: `${uploadForm.value.document_type} uspješno dodana.` });
    uploadForm.value = { document_type: null, file: null };
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri uploadu fajla.',
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
    $q.notify({ type: 'negative', message: 'Greška pri preuzimanju fajla.' });
  }
};

const deleteAttachment = (att) => {
  $q.dialog({
    title: 'Potvrda brisanja',
    message: `Jeste li sigurni da želite obrisati "${att.file_name}"?`,
    cancel: { flat: true, label: 'Odustani' },
    ok: { color: 'negative', label: 'Obriši', unelevated: true },
  }).onOk(async () => {
    try {
      await api.delete(`/attachments/delete/${att.id_attachment}`);
      $q.notify({ type: 'positive', message: 'Fajl uspješno obrisan.' });
      await fetchRequestDetails();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Greška pri brisanju fajla.',
      });
    }
  });
};

const completeRequest = async () => {
  submittingComplete.value = true;

  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: 'complete',
      comment: 'Zahtjev označen kao završen.',
    });
    $q.notify({ type: 'positive', message: 'Zahtjev označen kao završen.' });
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri zatvaranju zahtjeva.',
    });
  } finally {
    submittingComplete.value = false;
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
  if (
    ['reject', 'return-for-revision'].includes(pendingAction.value)
    && !actionComment.value.trim()
  ) {
    $q.notify({
      type: 'negative',
      message: 'Komentar je obavezan za ovu akciju.',
    });
    return;
  }

  submittingAction.value = true;

  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: pendingAction.value,
      comment: actionComment.value.trim() || null,
    });
    $q.notify({ type: 'positive', message: 'Status zahtjeva je uspješno ažuriran.' });
    closeActionDialog();
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri promjeni statusa zahtjeva.',
    });
  } finally {
    submittingAction.value = false;
  }
};

const resubmitRequest = async () => {
  submittingAction.value = true;

  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: 'resubmit',
      comment: 'Zahtjev ponovno poslan na odobravanje nakon ispravke.',
    });
    $q.notify({ type: 'positive', message: 'Zahtjev je ponovno poslan na odobravanje.' });
    await fetchRequestDetails();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri ponovnom slanju zahtjeva.',
    });
  } finally {
    submittingAction.value = false;
  }
};

const editRequest = () => router.push(`/requests/${route.params.id}/edit`);
const goBack = () => router.push('/requests');

const formatCurrency = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('hr-HR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('hr-HR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'poslano':
      return 'status-chip--draft';
    case 'na odobrenju':
      return 'status-chip--submitted';
    case 'vraćeno na izmjenu':
      return 'status-chip--returned';
    case 'odobreno':
      return 'status-chip--approved';
    case 'odbijeno':
      return 'status-chip--rejected';
    case 'naručeno':
      return 'status-chip--ordered';
    case 'zatvoreno':
      return 'status-chip--completed';
    default:
      return 'status-chip--default';
  }
};

const timelineTitle = (entry) => {
  if (entry.comment && entry.comment.startsWith('Dokument dodan:')) {
    return 'Dokument dodan';
  }
  return entry.status_name;
};

const timelineColor = (title) => {
  switch ((title || '').toLowerCase()) {
    case 'poslano': return 'indigo';
    case 'na odobrenju': return 'blue';
    case 'vraćeno na izmjenu': return 'orange';
    case 'odobreno': return 'positive';
    case 'odbijeno': return 'negative';
    case 'naručeno': return 'deep-purple';
    case 'zatvoreno': return 'green';
    case 'dokument dodan': return 'teal';
    default: return 'grey';
  }
};

const timelineIcon = (title) => {
  switch ((title || '').toLowerCase()) {
    case 'poslano': return 'outbox';
    case 'na odobrenju': return 'send';
    case 'vraćeno na izmjenu': return 'undo';
    case 'odobreno': return 'check_circle';
    case 'odbijeno': return 'cancel';
    case 'naručeno': return 'local_shipping';
    case 'zatvoreno': return 'task_alt';
    case 'dokument dodan': return 'attach_file';
    default: return 'circle';
  }
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
.details-page {
  background: #F9FAFB;
  min-height: 100vh;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.back-btn {
  color: #6B7280 !important;
  font-size: 0.875rem;
}

.page-hero {
  display: flex;
  flex-direction: column;
}

.page-eyebrow {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: #9CA3AF;
  text-transform: uppercase;
  margin-bottom: 8px;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.02em;
}

.page-meta {
  font-size: 0.875rem;
  color: #9CA3AF;
  margin-top: 4px;
}

/* Action banners */
.action-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  border-radius: 10px;
  border: 1px solid;
  flex-wrap: wrap;
}

.action-banner--warning {
  background: #FFFBEB;
  border-color: #FDE68A;
}

.action-banner--info {
  background: #EFF6FF;
  border-color: #BFDBFE;
}

.action-banner--success {
  background: #F0FDF4;
  border-color: #BBF7D0;
}

.action-banner__info { flex: 1; }

.action-banner__title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 3px;
}

.action-banner__desc {
  font-size: 0.875rem;
  color: #6B7280;
}

.action-banner__error {
  font-size: 0.8rem;
  color: #991B1B;
  margin-top: 4px;
}

.action-banner__btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* Info cards */
.info-card {
  background: #FFFFFF;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 20px 24px;
  height: 100%;
}

.info-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.info-card__title {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 14px;
}

.info-card__header .info-card__title {
  margin-bottom: 0;
}

.info-card__count {
  font-size: 0.8rem;
  color: #9CA3AF;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid #F3F4F6;
  font-size: 0.875rem;
  color: #6B7280;
}

.info-row:last-child { border-bottom: none; }

.info-row strong {
  color: #111827;
  font-weight: 600;
}

.justification-text {
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Status chips */
.status-chip {
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.75rem;
  padding: 4px 8px;
  height: auto;
}

.status-chip--draft { background: #EEF2FF; color: #4338CA; }
.status-chip--submitted { background: #EFF6FF; color: #1D4ED8; }
.status-chip--returned { background: #FFF7ED; color: #C2410C; }
.status-chip--approved { background: #ECFDF5; color: #065F46; }
.status-chip--rejected { background: #FEF2F2; color: #991B1B; }
.status-chip--ordered { background: #F5F3FF; color: #5B21B6; }
.status-chip--completed { background: #F0FDF4; color: #14532D; }
.status-chip--default { background: #F3F4F6; color: #6B7280; }

/* Table */
.items-table :deep(.q-table thead tr) { background: #F9FAFB; }
.items-table :deep(.q-table thead th) {
  color: #9CA3AF;
  font-weight: 600;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.items-table :deep(.q-table tbody td) {
  font-size: 0.875rem;
  color: #374151;
  border-bottom: 1px solid #F3F4F6;
}

/* Attachments */
.attachments-list :deep(.q-item) {
  padding: 10px 0;
}

.empty-state {
  font-size: 0.875rem;
  color: #9CA3AF;
  padding: 16px 0;
}

.upload-section-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.upload-btn {
  border-radius: 6px;
  background: #1E40AF !important;
}

/* Timeline */
.timeline-comment {
  background: #F9FAFB;
  border-left: 2px solid #D1D5DB;
  padding: 8px 12px;
  border-radius: 0 6px 6px 0;
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.5;
  margin-top: 6px;
}

/* Dialog */
.dialog-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #111827;
}

.dialog-desc {
  font-size: 0.875rem;
  color: #6B7280;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-banner {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
