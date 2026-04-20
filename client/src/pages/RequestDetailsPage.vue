<template>
  <q-page class="details-page q-pa-lg">
    <div class="page-shell">
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Natrag na zahtjeve"
        class="q-mb-md"
        @click="goBack"
      />

      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <div v-else-if="request">
        <!-- HEADER -->
        <section class="page-hero q-mb-lg">
          <div>
            <div class="text-overline text-primary text-weight-bold">
              ZAHTJEV ZA NABAVU
            </div>
            <div class="header-row q-mt-sm">
              <div class="text-h4 text-weight-bold page-title">
                {{ request.request_number }}
              </div>
              <q-chip dense class="status-chip" :class="statusClass(request.status_name)">
                {{ request.status_name }}
              </q-chip>
            </div>
            <div class="text-subtitle1 text-grey-7 q-mt-sm">
              Kreirao {{ request.created_by }} · {{ formatDate(request.created_at) }}
            </div>
          </div>
        </section>

        <!-- ADMIN: Odobri/Odbij -->
        <q-card v-if="canApproveOrReject" flat class="actions-card q-mb-lg">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Potrebna vaša odluka</div>
              <div class="text-body2 text-grey-7">
                Zahtjev čeka odobrenje. Možete ga odobriti ili odbiti.
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn unelevated no-caps color="negative" icon="close" label="Odbij" @click="openActionDialog('reject')" />
              <q-btn unelevated no-caps color="positive" icon="check" label="Odobri" @click="openActionDialog('approve')" />
            </div>
          </q-card-section>
        </q-card>

        <!-- ADMIN: Završi zahtjev -->
        <q-card v-if="canComplete" flat class="complete-card q-mb-lg">
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">Zahtjev je odobren</div>
              <div class="text-body2 text-grey-7">
                <span v-if="!canCloseRequest" class="text-negative">
                  ⚠ Nije moguće zatvoriti - potrebna je Ponuda i Otpremnica.
                  <span v-if="!hasPonuda"> Nedostaje: Ponuda.</span>
                  <span v-if="!hasOtpremnica"> Nedostaje: Otpremnica.</span>
                </span>
                <span v-else>Svi dokumenti su priloženi. Zahtjev možete označiti kao završen.</span>
              </div>
            </div>
            <q-btn
              unelevated no-caps color="primary" icon="task_alt" label="Označi završeno"
              :disable="!canCloseRequest" :loading="submittingComplete"
              @click="completeRequest"
            />
          </q-card-section>
        </q-card>

        <!-- Osnovni podaci + Obrazloženje -->
        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-md-6">
            <q-card flat class="info-card">
              <q-card-section>
                <div class="card-title">Osnovni podaci</div>
                <div class="info-row"><span>Fiskalna godina</span><strong>{{ request.fiscal_year }}</strong></div>
                <div class="info-row"><span>Odjel</span><strong>{{ request.department_name }}</strong></div>
                <div class="info-row">
                  <span>Status</span>
                  <q-chip dense class="status-chip" :class="statusClass(request.status_name)">{{ request.status_name }}</q-chip>
                </div>
                <div class="info-row"><span>Kreirao</span><strong>{{ request.created_by }}</strong></div>
                <div class="info-row"><span>Procjena iznosa</span><strong>{{ formatCurrency(request.total_amount) }}</strong></div>
                <div class="info-row"><span>Datum kreiranja</span><strong>{{ formatDate(request.created_at) }}</strong></div>
                <div v-if="request.updated_at" class="info-row"><span>Zadnja izmjena</span><strong>{{ formatDate(request.updated_at) }}</strong></div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-12 col-md-6">
            <q-card flat class="info-card">
              <q-card-section>
                <div class="card-title">Obrazloženje</div>
                <div class="justification-text">{{ request.justification || 'Nema obrazloženja.' }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- Stavke -->
        <q-card flat class="info-card q-mb-lg">
          <q-card-section>
            <div class="card-title-row">
              <div class="card-title">Stavke zahtjeva</div>
              <div class="text-body2 text-grey-6">Ukupno: {{ items.length }}</div>
            </div>
            <q-table
              :rows="items" :columns="itemsColumns"
              row-key="id_purchase_request_item"
              flat hide-bottom :pagination="{ rowsPerPage: 0 }"
              class="items-table"
            />
          </q-card-section>
        </q-card>

        <!-- DOKUMENTI -->
        <q-card flat class="info-card q-mb-lg">
          <q-card-section>
            <div class="card-title-row">
              <div class="card-title">Dokumenti</div>
              <div class="row q-gutter-xs">
                <q-chip dense :color="hasPonuda ? 'positive' : 'grey-4'" :text-color="hasPonuda ? 'white' : 'grey-7'" icon="description">Ponuda</q-chip>
                <q-chip dense :color="hasOtpremnica ? 'positive' : 'grey-4'" :text-color="hasOtpremnica ? 'white' : 'grey-7'" icon="local_shipping">Otpremnica</q-chip>
              </div>
            </div>

            <div v-if="attachments.length === 0" class="text-grey-6 q-py-md">
              Još nema priloženih dokumenata.
            </div>

            <q-list v-else separator class="q-mb-md">
              <q-item v-for="att in attachments" :key="att.id_attachment">
                <q-item-section avatar>
                  <q-icon :name="fileIcon(att.file_type)" color="primary" size="28px" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">{{ att.file_name }}</q-item-label>
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

            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Dodaj dokument</div>
            <div class="row q-col-gutter-md items-end">
              <div class="col-12 col-md-4">
                <q-select v-model="uploadForm.document_type" :options="['Ponuda', 'Otpremnica']" label="Tip dokumenta" outlined dense />
              </div>
              <div class="col-12 col-md-6">
                <q-file v-model="uploadForm.file" label="Odaberi fajl" outlined dense clearable>
                  <template #prepend><q-icon name="attach_file" /></template>
                </q-file>
              </div>
              <div class="col-12 col-md-2">
                <q-btn
                  unelevated no-caps color="primary" icon="upload" label="Upload" class="full-width"
                  :loading="uploading" :disable="!uploadForm.file || !uploadForm.document_type"
                  @click="uploadAttachment"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- TIMELINE -->
        <q-card flat class="info-card">
          <q-card-section>
            <div class="card-title">Povijest aktivnosti</div>
            <div v-if="history.length === 0" class="text-grey-6 q-py-md">Još nema zapisa povijesti.</div>
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
          </q-card-section>
        </q-card>
      </div>

      <div v-else class="text-grey-6 text-center q-pa-xl">Zahtjev nije pronađen.</div>
    </div>

    <!-- DIJALOG: Odobri/Odbij -->
    <q-dialog v-model="actionDialog" persistent>
      <q-card style="min-width: 450px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">{{ pendingAction === 'approve' ? 'Odobravanje zahtjeva' : 'Odbijanje zahtjeva' }}</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{ pendingAction === 'approve' ? 'Komentar je neobavezan, ali preporučen.' : 'Komentar je obavezan pri odbijanju zahtjeva.' }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input v-model="actionComment" type="textarea" outlined :label="pendingAction === 'approve' ? 'Komentar (neobavezno)' : 'Komentar *'" rows="4" :disable="submittingAction" autofocus />
        </q-card-section>
        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Odustani" :disable="submittingAction" @click="closeActionDialog" />
          <q-btn unelevated no-caps :color="pendingAction === 'approve' ? 'positive' : 'negative'" :icon="pendingAction === 'approve' ? 'check' : 'close'" :label="pendingAction === 'approve' ? 'Odobri' : 'Odbij'" :loading="submittingAction" @click="confirmAction" />
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

const currentUser = computed(() => {
  try {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
});

const isAdmin = computed(() => currentUser.value?.role_name === 'Administrator');
const hasPonuda = computed(() => attachments.value.some((a) => a.document_type === 'Ponuda'));
const hasOtpremnica = computed(() => attachments.value.some((a) => a.document_type === 'Otpremnica'));
const canApproveOrReject = computed(() => isAdmin.value && request.value?.status_name === 'U obradi');
const canComplete = computed(() => isAdmin.value && request.value?.status_name === 'Odobreno');
const canCloseRequest = computed(() => hasPonuda.value && hasOtpremnica.value);

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
    items.value = detailsRes.data.items;
    history.value = detailsRes.data.history || [];
    attachments.value = attachmentsRes.data || [];
  } catch (error) {
    console.error('Greška:', error);
    $q.notify({ type: 'negative', message: 'Greška pri dohvaćanju zahtjeva.' });
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
    const message = error.response?.data?.message || 'Greška pri uploadu fajla.';
    $q.notify({ type: 'negative', message });
  } finally {
    uploading.value = false;
  }
};

const downloadAttachment = async (att) => {
  try {
    const response = await api.get(`/attachments/download/${att.id_attachment}`, { responseType: 'blob' });
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
      const message = error.response?.data?.message || 'Greška pri brisanju fajla.';
      $q.notify({ type: 'negative', message });
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
    const message = error.response?.data?.message || 'Greška pri zatvaranju zahtjeva.';
    $q.notify({ type: 'negative', message });
  } finally {
    submittingComplete.value = false;
  }
};

const openActionDialog = (action) => { pendingAction.value = action; actionComment.value = ''; actionDialog.value = true; };
const closeActionDialog = () => { actionDialog.value = false; pendingAction.value = null; actionComment.value = ''; };

const confirmAction = async () => {
  if (pendingAction.value === 'reject' && !actionComment.value.trim()) {
    $q.notify({ type: 'negative', message: 'Komentar je obavezan pri odbijanju.' });
    return;
  }
  submittingAction.value = true;
  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: pendingAction.value,
      comment: actionComment.value.trim() || null,
    });
    $q.notify({ type: 'positive', message: pendingAction.value === 'approve' ? 'Zahtjev je odobren.' : 'Zahtjev je odbijen.' });
    closeActionDialog();
    await fetchRequestDetails();
  } catch (error) {
    const message = error.response?.data?.message || 'Greška pri promjeni statusa zahtjeva.';
    $q.notify({ type: 'negative', message });
  } finally {
    submittingAction.value = false;
  }
};

const goBack = () => router.push('/requests');

const formatCurrency = (value) => {
  if (value == null) return '-';
  return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(value);
};

const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const statusClass = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'skica':     return 'status-chip--draft';
    case 'u obradi':  return 'status-chip--submitted';
    case 'odobreno':  return 'status-chip--approved';
    case 'odbijeno':  return 'status-chip--rejected';
    case 'završeno':  return 'status-chip--completed';
    default:          return 'status-chip--default';
  }
};

// Određuje naslov timeline entry-a
// Ako komentar počinje s "Dokument dodan:" → prikaži to umjesto statusa
const timelineTitle = (entry) => {
  if (entry.comment && entry.comment.startsWith('Dokument dodan:')) {
    return 'Dokument dodan';
  }
  return entry.status_name;
};

// Boja ovisi o naslovu (ne raw statusu iz baze)
const timelineColor = (title) => {
  switch ((title || '').toLowerCase()) {
    case 'skica':          return 'indigo';
    case 'u obradi':       return 'blue';
    case 'odobreno':       return 'positive';
    case 'odbijeno':       return 'negative';
    case 'završeno':       return 'green';
    case 'dokument dodan': return 'teal';
    default:               return 'grey';
  }
};

// Ikona ovisi o naslovu (ne raw statusu iz baze)
const timelineIcon = (title) => {
  switch ((title || '').toLowerCase()) {
    case 'skica':          return 'edit_note';
    case 'u obradi':       return 'send';
    case 'odobreno':       return 'check_circle';
    case 'odbijeno':       return 'cancel';
    case 'završeno':       return 'task_alt';
    case 'dokument dodan': return 'attach_file';
    default:               return 'circle';
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

onMounted(() => { fetchRequestDetails(); });
</script>

<style scoped>
.details-page {
  background: radial-gradient(circle at top right, rgba(25, 118, 210, 0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #f4f7fb 100%);
  min-height: 100vh;
}
.page-shell { max-width: 1280px; margin: 0 auto; }
.page-hero { display: flex; flex-direction: column; }
.header-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
.page-title { letter-spacing: -0.02em; }
.info-card { border-radius: 20px; background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(15, 23, 42, 0.06); box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05); height: 100%; }
.actions-card { border-radius: 20px; background: #fefce8; border: 1px solid #fde68a; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.1); }
.complete-card { border-radius: 20px; background: #f0fdf4; border: 1px solid #bbf7d0; box-shadow: 0 8px 20px rgba(34, 197, 94, 0.1); }
.card-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
.card-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.info-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 10px 0; border-bottom: 1px solid rgba(15, 23, 42, 0.06); color: #475569; }
.info-row:last-child { border-bottom: none; }
.info-row strong { color: #0f172a; }
.justification-text { color: #334155; line-height: 1.6; white-space: pre-wrap; margin-top: 8px; }
.status-chip { border-radius: 999px; font-weight: 700; padding: 6px 12px; font-size: 0.82rem; }
.status-chip--draft     { background: #eef2ff; color: #4f46e5; }
.status-chip--submitted { background: #eff6ff; color: #2563eb; }
.status-chip--approved  { background: #ecfdf3; color: #15803d; }
.status-chip--rejected  { background: #fef2f2; color: #dc2626; }
.status-chip--completed { background: #f0fdf4; color: #166534; }
.status-chip--default   { background: #f1f5f9; color: #475569; }
.items-table :deep(.q-table thead tr) { background: #f8fafc; }
.items-table :deep(.q-table thead th) { color: #64748b; font-weight: 700; font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.03em; }
.timeline-comment { background: #f8fafc; border-left: 3px solid #cbd5e1; padding: 10px 14px; border-radius: 8px; color: #334155; margin-top: 8px; font-size: 0.92rem; line-height: 1.5; }
@media (max-width: 768px) { .header-row { flex-direction: column; align-items: flex-start; } }
</style>
