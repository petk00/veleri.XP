<template>
  <q-page class="details-page q-pa-lg">
    <div class="page-shell">
      <!-- Natrag gumb -->
      <q-btn
        flat
        no-caps
        color="primary"
        icon="arrow_back"
        label="Natrag na zahtjeve"
        class="q-mb-md"
        @click="goBack"
      />

      <!-- Loading state -->
      <div v-if="loading" class="row justify-center q-pa-xl">
        <q-spinner color="primary" size="40px" />
      </div>

      <!-- Main content -->
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
              <q-chip
                dense
                class="status-chip"
                :class="statusClass(request.status_name)"
              >
                {{ request.status_name }}
              </q-chip>
            </div>
            <div class="text-subtitle1 text-grey-7 q-mt-sm">
              Kreirao {{ request.created_by }} · {{ formatDate(request.created_at) }}
            </div>
          </div>
        </section>

        <!-- ADMIN AKCIJE - samo ako je user admin I status je Submitted -->
        <q-card
          v-if="canApproveOrReject"
          flat
          class="actions-card q-mb-lg"
        >
          <q-card-section class="row items-center justify-between">
            <div>
              <div class="text-subtitle1 text-weight-bold">
                Potrebna vaša odluka
              </div>
              <div class="text-body2 text-grey-7">
                Zahtjev čeka odobrenje. Možete ga odobriti ili odbiti.
              </div>
            </div>
            <div class="row q-gutter-sm">
              <q-btn
                unelevated
                no-caps
                color="negative"
                icon="close"
                label="Odbij"
                @click="openActionDialog('reject')"
              />
              <q-btn
                unelevated
                no-caps
                color="positive"
                icon="check"
                label="Odobri"
                @click="openActionDialog('approve')"
              />
            </div>
          </q-card-section>
        </q-card>

        <!-- PRVI RED: Osnovni podaci + Obrazloženje -->
        <div class="row q-col-gutter-lg q-mb-lg">
          <div class="col-12 col-md-6">
            <q-card flat class="info-card">
              <q-card-section>
                <div class="card-title">Osnovni podaci</div>

                <div class="info-row">
                  <span>Fiskalna godina</span>
                  <strong>{{ request.fiscal_year }}</strong>
                </div>
                <div class="info-row">
                  <span>Odjel</span>
                  <strong>{{ request.department_name }}</strong>
                </div>
                <div class="info-row">
                  <span>Status</span>
                  <q-chip
                    dense
                    class="status-chip"
                    :class="statusClass(request.status_name)"
                  >
                    {{ request.status_name }}
                  </q-chip>
                </div>
                <div class="info-row">
                  <span>Kreirao</span>
                  <strong>{{ request.created_by }}</strong>
                </div>
                <div class="info-row">
                  <span>Procjena iznosa</span>
                  <strong>{{ formatCurrency(request.total_amount) }}</strong>
                </div>
                <div class="info-row">
                  <span>Datum kreiranja</span>
                  <strong>{{ formatDate(request.created_at) }}</strong>
                </div>
                <div v-if="request.updated_at" class="info-row">
                  <span>Zadnja izmjena</span>
                  <strong>{{ formatDate(request.updated_at) }}</strong>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="col-12 col-md-6">
            <q-card flat class="info-card justification-card">
              <q-card-section>
                <div class="card-title">Obrazloženje</div>
                <div class="justification-text">
                  {{ request.justification || 'Nema obrazloženja.' }}
                </div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <!-- STAVKE ZAHTJEVA -->
        <q-card flat class="info-card q-mb-lg">
          <q-card-section>
            <div class="card-title-row">
              <div class="card-title">Stavke zahtjeva</div>
              <div class="text-body2 text-grey-6">
                Ukupno: {{ items.length }}
              </div>
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
          </q-card-section>
        </q-card>

        <!-- TIMELINE / STATUS HISTORY -->
        <q-card flat class="info-card">
          <q-card-section>
            <div class="card-title">Povijest statusa</div>

            <div v-if="history.length === 0" class="text-grey-6 q-py-md">
              Još nema zapisa povijesti.
            </div>

            <q-timeline v-else color="primary" class="q-mt-md">
              <q-timeline-entry
                v-for="entry in history"
                :key="entry.id_request_status_history"
                :title="entry.status_name"
                :subtitle="`${entry.changed_by} · ${formatDate(entry.changed_at)}`"
                :color="timelineColor(entry.status_name)"
                :icon="timelineIcon(entry.status_name)"
              >
                <div v-if="entry.comment" class="timeline-comment">
                  {{ entry.comment }}
                </div>
              </q-timeline-entry>
            </q-timeline>
          </q-card-section>
        </q-card>
      </div>

      <!-- Error state -->
      <div v-else class="text-grey-6 text-center q-pa-xl">
        Zahtjev nije pronađen.
      </div>
    </div>

    <!-- DIJALOG ZA KOMENTAR -->
    <q-dialog v-model="actionDialog" persistent>
      <q-card style="min-width: 450px; max-width: 90vw;">
        <q-card-section>
          <div class="text-h6">
            {{ pendingAction === 'approve' ? 'Odobravanje zahtjeva' : 'Odbijanje zahtjeva' }}
          </div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            {{
              pendingAction === 'approve'
                ? 'Komentar je neobavezan, ali preporučen.'
                : 'Komentar je obavezan pri odbijanju zahtjeva.'
            }}
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="actionComment"
            type="textarea"
            outlined
            :label="pendingAction === 'approve' ? 'Komentar (neobavezno)' : 'Komentar *'"
            rows="4"
            :disable="submittingAction"
            autofocus
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn
            flat
            no-caps
            label="Odustani"
            :disable="submittingAction"
            @click="closeActionDialog"
          />
          <q-btn
            unelevated
            no-caps
            :color="pendingAction === 'approve' ? 'positive' : 'negative'"
            :icon="pendingAction === 'approve' ? 'check' : 'close'"
            :label="pendingAction === 'approve' ? 'Odobri' : 'Odbij'"
            :loading="submittingAction"
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

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

// --- State ---
const loading = ref(false);
const request = ref(null);
const items = ref([]);
const history = ref([]);

// Dijalog state
const actionDialog = ref(false);
const pendingAction = ref(null); // 'approve' | 'reject'
const actionComment = ref('');
const submittingAction = ref(false);

// --- User iz localStorage (za admin check) ---
const currentUser = computed(() => {
  try {
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  } catch {
    return null;
  }
});

const isAdmin = computed(() => {
  return currentUser.value?.role_name === 'Administrator';
});

// Admin može approve/reject samo ako je status Submitted
const canApproveOrReject = computed(() => {
  return isAdmin.value && request.value?.status_name === 'Submitted';
});

// --- Kolone tablice stavki ---
const itemsColumns = [
  { name: 'item_name', label: 'Naziv artikla', field: 'item_name', align: 'left' },
  { name: 'category_name', label: 'Kategorija', field: 'category_name', align: 'left' },
  { name: 'quantity', label: 'Količina', field: 'quantity', align: 'right' },
];

// --- API pozivi ---
const fetchRequestDetails = async () => {
  loading.value = true;

  try {
    const response = await api.get(`/requests/${route.params.id}`);
    request.value = response.data.request;
    items.value = response.data.items;
    history.value = response.data.history || [];
  } catch (error) {
    console.error('Greška kod dohvaćanja detalja:', error);

    $q.notify({
      type: 'negative',
      message: 'Greška pri dohvaćanju zahtjeva.',
    });

    request.value = null;
  } finally {
    loading.value = false;
  }
};

// --- Dijalog handleri ---
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
  // Reject zahtijeva komentar
  if (pendingAction.value === 'reject' && !actionComment.value.trim()) {
    $q.notify({
      type: 'negative',
      message: 'Komentar je obavezan pri odbijanju.',
    });
    return;
  }

  submittingAction.value = true;

  try {
    await api.patch(`/requests/${route.params.id}/status`, {
      action: pendingAction.value,
      comment: actionComment.value.trim() || null,
    });

    $q.notify({
      type: 'positive',
      message:
        pendingAction.value === 'approve'
          ? 'Zahtjev je odobren.'
          : 'Zahtjev je odbijen.',
    });

    closeActionDialog();

    // Refresh detalja - povuci nove podatke
    await fetchRequestDetails();
  } catch (error) {
    console.error('Greška pri promjeni statusa:', error);

    const message =
      error.response?.data?.message ||
      'Greška pri promjeni statusa zahtjeva.';

    $q.notify({
      type: 'negative',
      message,
    });
  } finally {
    submittingAction.value = false;
  }
};

// --- Utility funkcije ---
const goBack = () => {
  router.push('/requests');
};

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
    case 'draft':
      return 'status-chip--draft';
    case 'submitted':
      return 'status-chip--submitted';
    case 'approved':
      return 'status-chip--approved';
    case 'rejected':
      return 'status-chip--rejected';
    case 'completed':
      return 'status-chip--completed';
    default:
      return 'status-chip--default';
  }
};

// Boja za timeline entry (q-timeline-entry prop)
const timelineColor = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'draft':
      return 'indigo';
    case 'submitted':
      return 'blue';
    case 'approved':
      return 'positive';
    case 'rejected':
      return 'negative';
    case 'completed':
      return 'green';
    default:
      return 'grey';
  }
};

// Ikona za timeline entry
const timelineIcon = (status) => {
  switch ((status || '').toLowerCase()) {
    case 'draft':
      return 'edit_note';
    case 'submitted':
      return 'send';
    case 'approved':
      return 'check_circle';
    case 'rejected':
      return 'cancel';
    case 'completed':
      return 'task_alt';
    default:
      return 'circle';
  }
};

onMounted(() => {
  fetchRequestDetails();
});
</script>

<style scoped>
.details-page {
  background:
    radial-gradient(circle at top right, rgba(25, 118, 210, 0.06), transparent 24%),
    linear-gradient(180deg, #f8fafc 0%, #f4f7fb 100%);
  min-height: 100vh;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  flex-direction: column;
}

.header-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.page-title {
  letter-spacing: -0.02em;
}

.info-card {
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  height: 100%;
}

.actions-card {
  border-radius: 20px;
  background: #fefce8;
  border: 1px solid #fde68a;
  box-shadow: 0 8px 20px rgba(245, 158, 11, 0.1);
}

.card-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  color: #475569;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row strong {
  color: #0f172a;
}

.justification-card {
  height: 100%;
}

.justification-text {
  color: #334155;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-top: 8px;
}

.status-chip {
  border-radius: 999px;
  font-weight: 700;
  padding: 6px 12px;
  font-size: 0.82rem;
}

.status-chip--draft {
  background: #eef2ff;
  color: #4f46e5;
}

.status-chip--submitted {
  background: #eff6ff;
  color: #2563eb;
}

.status-chip--approved {
  background: #ecfdf3;
  color: #15803d;
}

.status-chip--rejected {
  background: #fef2f2;
  color: #dc2626;
}

.status-chip--completed {
  background: #f0fdf4;
  color: #166534;
}

.status-chip--default {
  background: #f1f5f9;
  color: #475569;
}

.items-table :deep(.q-table thead tr) {
  background: #f8fafc;
}

.items-table :deep(.q-table thead th) {
  color: #64748b;
  font-weight: 700;
  font-size: 0.82rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.timeline-comment {
  background: #f8fafc;
  border-left: 3px solid #cbd5e1;
  padding: 10px 14px;
  border-radius: 8px;
  color: #334155;
  margin-top: 8px;
  font-size: 0.92rem;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .header-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>