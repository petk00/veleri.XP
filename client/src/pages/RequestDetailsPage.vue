<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Back link -->
      <button class="back-link no-print" @click="goBack">
        <q-icon name="arrow_back" size="14px" />
        <span>Natrag na zahtjeve</span>
      </button>

      <!-- Loading -->
      <div v-if="loading" class="loading-block no-print">
        <q-spinner color="primary" size="32px" />
      </div>

      <!-- Content -->
      <div v-else-if="request">

        <!-- ──────────────── PAGE HEADER ──────────────── -->
        <header class="page-header no-print">
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
            <button
              v-if="canDownloadPdf"
              class="btn btn--ghost"
              :disabled="pdfGenerating"
              @click="downloadPdf"
            >
              <q-spinner v-if="pdfGenerating" size="14px" />
              <q-icon v-else name="download" size="16px" />
              <span>{{ pdfGenerating ? 'Generiranje...' : 'Preuzmi PDF' }}</span>
            </button>
            <span v-else-if="isAdmin" class="pdf-locked">
              <q-icon name="lock" size="14px" />
              <span>Preuzmi PDF</span>
              <q-tooltip anchor="bottom middle" self="top middle">
                PDF je dostupan tek nakon odobrenja zahtjeva.
              </q-tooltip>
            </span>
            <button v-if="canEdit" class="btn btn--ghost" @click="editRequest">
              <q-icon name="edit" size="16px" />
              <span>Uredi</span>
            </button>
            <button v-if="isAdmin && status && !LOCKED_STATUSES.includes(status)" class="btn btn--danger" @click="openActionDialog('storno')">
              <q-icon name="block" size="16px" />
              <span>Storniraj</span>
            </button>
          </div>
        </header>

        <!-- ──────────────── ACTION BANNERS ──────────────── -->
        <div v-if="canTakeOver" class="action-banner action-banner--neutral no-print">
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

        <div v-if="canDecide" class="action-banner action-banner--warning no-print">
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

        <div v-if="canResubmit" class="action-banner action-banner--info no-print">
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

        <div v-if="isAdmin && status === STATUS.VRACENO" class="action-banner action-banner--neutral no-print">
          <div class="action-banner__icon">
            <q-icon name="hourglass_empty" size="18px" />
          </div>
          <div class="action-banner__body">
            <div class="action-banner__title">Čeka odgovor podnositelja</div>
            <div class="action-banner__desc">
              Zahtjev je vraćen podnositelju na dopunu. Možete ga preuzeti na ponovnu obradu bez čekanja ili ga odbiti.
            </div>
          </div>
          <div class="action-banner__actions">
            <button class="btn btn--danger" @click="openActionDialog('odbij')">
              <q-icon name="close" size="16px" />
              <span>Odbij</span>
            </button>
            <button class="btn btn--primary" :disabled="submittingAction" @click="quickAction('vrati-u-obradu')">
              <q-spinner v-if="submittingAction" size="14px" color="white" />
              <q-icon v-else name="assignment_turned_in" size="16px" />
              <span>Preuzmi na obradu</span>
            </button>
          </div>
        </div>

        <div v-if="canFinish" class="action-banner action-banner--success no-print">
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

        <!-- ──────────────── INFO CARDS ──────────────── -->
        <div class="info-grid no-print">
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
        <div class="card no-print">
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
        <div class="card no-print">
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
                  <button v-if="canPreview(att)" class="icon-btn" @click="previewAttachment(att)">
                    <q-icon name="visibility" size="16px" />
                    <q-tooltip>Prikaži</q-tooltip>
                  </button>
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
        <div class="card no-print">
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

        <!-- ════════════════════════════════════════════
             PRINT VIEW — Veleri obrazac
             Skriven na ekranu, vidljiv samo pri ispisu
             ════════════════════════════════════════════ -->
        <article class="print-view">

          <!-- Zaglavlje institucije -->
          <header class="print-header">
            <div class="print-header__left">
              <img :src="ORG.logoPath" alt="Logo" class="print-header__logo" />
              <div class="print-header__inst">{{ ORG.name }}</div>
            </div>
            <div class="print-header__right">
              <div>{{ ORG.nameLatin }}</div>
              <div class="print-header__right-en">{{ ORG.nameEnglish }}</div>
            </div>
          </header>

          <div class="print-header__contact">
            {{ ORG.address }} · Telefon {{ ORG.phone }} · E-mail: {{ ORG.email }} · {{ ORG.web }}<br>
            OIB: {{ ORG.oib }} · MB: {{ ORG.mb }} · RKP: {{ ORG.rkp }} · IBAN: {{ ORG.iban }}
          </div>

          <div class="print-header__line"></div>

          <!-- Naslov u okviru -->
          <div class="print-title-box">
            <h1>ZAHTJEV ZA NABAVU</h1>
          </div>

          <!-- Polja obrasca -->
          <div class="print-fields">
            <div class="print-fields__label">Broj zahtjeva:</div>
            <div class="print-fields__value">{{ request.request_number }}</div>

            <div class="print-fields__label">Datum:</div>
            <div class="print-fields__value">{{ formatDateOnly(request.created_at) }}</div>

            <div class="print-fields__label">
              Zahtjev podnio:
              <span class="print-fields__label-sub">(ime i prezime djelatnika)</span>
            </div>
            <div class="print-fields__value">{{ request.created_by }}</div>

            <div class="print-fields__label">Odjel / Služba:</div>
            <div class="print-fields__value">{{ request.department_name }}</div>

            <div class="print-fields__label">
              Predmet nabave:
              <span class="print-fields__label-sub">(kategorija)</span>
            </div>
            <div class="print-fields__value">{{ predmetNabave }}</div>
          </div>

          <!-- Svrha nabave u okviru -->
          <div class="print-purpose">
            <div class="print-purpose__box">
              <div class="print-purpose__label">Svrha nabave (obrazloženje):</div>
              <div class="print-purpose__text">{{ request.justification || '—' }}</div>
            </div>
          </div>

          <!-- Specifikacija stavki (samo ako postoje) -->
          <div v-if="items.length > 0" class="print-items">
            <div class="print-items__title">Specifikacija stavki:</div>
            <table>
              <thead>
                <tr>
                  <th style="width: 55%;">Naziv artikla</th>
                  <th style="width: 30%;">Kategorija</th>
                  <th class="num" style="width: 15%;">Količina</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in items" :key="item.id_purchase_request_item">
                  <td>{{ item.item_name }}</td>
                  <td>{{ item.category_name }}</td>
                  <td class="num">{{ item.quantity }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Ukupni iznos -->
          <div class="print-total">
            Ukupna nabava se procjenjuje na iznos od
            <strong>{{ formatCurrency(request.total_amount) }}</strong>.
          </div>

          <!-- Status + datum ispisa -->
          <div class="print-stamp">
            <span>Status: <strong>{{ request.status_name }}</strong></span>
            <span>Ispisano: {{ todayDate }}</span>
          </div>

        </article>

      </div>

      <!-- 404 -->
      <div v-else class="empty-block--page no-print">
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
import { jsPDF } from 'jspdf';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

/* ───────────────────────────────────
   Konfiguracija institucije za PRINT
   ─────────────────────────────────── */
const ORG = {
  name: 'VELEUČILIŠTE U RIJECI',
  nameLatin: 'COLLEGIUM FLUMINENSE',
  nameEnglish: 'POLYTECHNIC OF RIJEKA',
  address: '51000 RIJEKA - HR - Trpimirova 2/V',
  phone: '(051) 321-300',
  email: 'ured@veleri.hr',
  web: 'https://www.veleri.hr',
  oib: '29573709870',
  mb: '01387332',
  rkp: '22494',
  iban: 'HR6824020061100451485',
  logoPath: '/logo33.svg', // Veleri službeni logo za ispis
};

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
  Ponuda: [STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO, STATUS.NARUCENO],
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
const pdfGenerating = ref(false);

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

const canDownloadPdf = computed(() =>
  isAdmin.value && [STATUS.NARUCENO, STATUS.ZATVORENO].includes(status.value),
);

const lastReturnComment = computed(() => {
  const entries = history.value.filter((h) => h.fk_request_status === STATUS.VRACENO);
  if (entries.length === 0) return null;
  return entries[entries.length - 1].comment || null;
});

const allowedDocumentTypes = computed(() => {
  if (!status.value) return [];
  return Object.entries(UPLOAD_RULES)
    .filter(([type, allowed]) => {
      if (!allowed.includes(status.value)) return false;
      // U NARUCENO fazi ponuda je već trebala biti priložena pri odobrenju.
      // Pokazujemo je samo ako nedostaje (edge case: obrisana).
      if (status.value === STATUS.NARUCENO && type === 'Ponuda') return !hasPonuda.value;
      return true;
    })
    .map(([type]) => type);
});
const canUploadAny = computed(() => allowedDocumentTypes.value.length > 0);
const effectiveDocumentType = computed(() => {
  if (allowedDocumentTypes.value.length === 1) return allowedDocumentTypes.value[0];
  return uploadForm.value.document_type;
});
const UPLOAD_FORMATS_HINT = 'Dozvoljeni formati: PDF, DOC, DOCX, JPG, PNG. Maks. veličina: 5 MB.';

const uploadHint = computed(() => {
  if (!status.value) return '';
  if (status.value === STATUS.NARUCENO) return `U ovoj fazi može se učitati otpremnica. ${UPLOAD_FORMATS_HINT}`;
  if ([STATUS.POSLANO, STATUS.NA_ODOBRENJU, STATUS.VRACENO].includes(status.value)) {
    return `U ovoj fazi može se učitati ponuda. ${UPLOAD_FORMATS_HINT}`;
  }
  return '';
});

/* "Predmet nabave" — kategorije iz stavki, unique, sortirano */
const predmetNabave = computed(() => {
  if (!items.value.length) return '—';
  const set = new Set(items.value.map(i => i.category_name).filter(Boolean));
  return [...set].sort().join(', ');
});

const todayDate = computed(() => {
  return new Date().toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
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
    case 'storno': return 'Storniranje zahtjeva';
    default: return 'Akcija nad zahtjevom';
  }
});
const dialogDescription = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Komentar je neobavezan, ali preporučen.';
    case 'odbij': return 'Komentar je obavezan pri odbijanju zahtjeva.';
    case 'vrati-na-izmjenu': return 'Komentar je obavezan kako bi podnositelj znao što ispraviti.';
    case 'storno': return 'Navedite razlog storniranja. Akcija je nepovratna.';
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
    case 'odbij':
    case 'storno': return 'btn--danger';
    default: return 'btn--primary';
  }
});
const dialogConfirmIcon = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'check';
    case 'vrati-na-izmjenu': return 'undo';
    case 'odbij': return 'close';
    case 'storno': return 'block';
    default: return '';
  }
});
const dialogConfirmLabel = computed(() => {
  switch (pendingAction.value) {
    case 'odobri': return 'Odobri';
    case 'vrati-na-izmjenu': return 'Vrati na dopunu';
    case 'odbij': return 'Odbij';
    case 'storno': return 'Storniraj';
    default: return 'Potvrdi';
  }
});

/* ───────── API ───────── */

const fetchRequestDetails = async (isRefresh = false) => {
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
    if (!isRefresh) request.value = null;
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
    await fetchRequestDetails(true);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri uploadu.',
    });
  } finally {
    uploading.value = false;
  }
};

const canPreview = (att) => {
  const t = att.file_type || '';
  return t.includes('pdf') || t.startsWith('image/') || t.startsWith('text/');
};

const previewAttachment = async (att) => {
  try {
    const response = await api.get(`/attachments/download/${att.id_attachment}`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: att.file_type });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch {
    $q.notify({ type: 'negative', message: 'Greška pri otvaranju datoteke.' });
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
      await fetchRequestDetails(true);
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
      'vrati-u-obradu': 'Zahtjev preuzet na ponovnu obradu.',
    };
    $q.notify({ type: 'positive', message: messages[action] || 'Akcija izvršena.' });
    await fetchRequestDetails(true);
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
  const requiresComment = ['odbij', 'vrati-na-izmjenu', 'storno'].includes(pendingAction.value);
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
    await fetchRequestDetails(true);
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

const svgToPng = (src, size = 128) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = size; c.height = size;
      c.getContext('2d').drawImage(img, 0, 0, size, size);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });

const downloadPdf = async () => {
  if (!request.value) return;
  pdfGenerating.value = true;
  try {
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const M   = 18;           // margina
    const PW  = 210;          // širina A4
    const CW  = PW - 2 * M;  // širina sadržaja
    let y = M;

    // ── Logo ──
    const logoPng = await svgToPng(ORG.logoPath, 128);
    const LOGO_SIZE = 13;
    if (logoPng) pdf.addImage(logoPng, 'PNG', M, y - 1, LOGO_SIZE, LOGO_SIZE);

    // ── Naziv institucije ──
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(31, 56, 100);
    pdf.text(ORG.name, M + (logoPng ? LOGO_SIZE + 3 : 0), y + 5);

    pdf.setFontSize(8);
    pdf.text(ORG.nameLatin, PW - M, y + 2, { align: 'right' });
    pdf.setFont('helvetica', 'italic');
    pdf.text(ORG.nameEnglish, PW - M, y + 7, { align: 'right' });

    y += LOGO_SIZE + 2;

    // ── Kontakt linija ──
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(85, 85, 85);
    pdf.text(
      `${ORG.address} · Telefon ${ORG.phone} · E-mail: ${ORG.email} · ${ORG.web}`,
      PW / 2, y, { align: 'center' }
    );
    y += 3.5;
    pdf.text(
      `OIB: ${ORG.oib} · MB: ${ORG.mb} · RKP: ${ORG.rkp} · IBAN: ${ORG.iban}`,
      PW / 2, y, { align: 'center' }
    );
    y += 5;

    // ── Horizontalna crta ──
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(M, y, PW - M, y);
    y += 8;

    // ── Naslov u okviru ──
    pdf.setLineWidth(0.3);
    pdf.rect(M, y, CW, 10);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(0);
    pdf.text('ZAHTJEV ZA NABAVU', PW / 2, y + 7, { align: 'center' });
    y += 16;

    // ── Polja ──
    const LABEL_W = 58;
    const VALUE_X = M + LABEL_W + 4;
    const fields = [
      { label: 'Broj zahtjeva:',                              value: request.value.request_number },
      { label: 'Datum:',                                      value: formatDateOnly(request.value.created_at) },
      { label: 'Zahtjev podnio\n(ime i prezime djelatnika):', value: request.value.created_by },
      { label: 'Odjel / Služba:',                            value: request.value.department_name },
      { label: 'Predmet nabave\n(kategorija):',               value: predmetNabave.value },
    ];

    pdf.setFontSize(10);
    for (const f of fields) {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0);
      const labelLines = pdf.splitTextToSize(f.label, LABEL_W);
      pdf.text(labelLines, M, y);
      pdf.setFont('helvetica', 'bold');
      pdf.text(String(f.value || '—'), VALUE_X, y);
      y += labelLines.length * 5 + 3;
    }
    y += 3;

    // ── Svrha nabave (okvir) ──
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(0);
    pdf.text('Svrha nabave (obrazloženje):', M, y);
    y += 4;

    const justLines = pdf.splitTextToSize(request.value.justification || '—', CW - 8);
    const boxH = Math.max(34, justLines.length * 5 + 8);
    pdf.setLineWidth(0.3);
    pdf.rect(M, y, CW, boxH);
    pdf.text(justLines, M + 4, y + 6);
    y += boxH + 8;

    // ── Stavke ──
    if (items.value.length > 0) {
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(9);
      pdf.setTextColor(85, 85, 85);
      pdf.text('Specifikacija stavki:', M, y);
      y += 5;

      const cols  = [CW * 0.55, CW * 0.30, CW * 0.15];
      const ROW_H = 7;

      // Zaglavlje tablice
      pdf.setFillColor(240, 240, 240);
      let cx = M;
      cols.forEach((cw) => { pdf.rect(cx, y, cw, ROW_H, 'FD'); cx += cw; });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0);
      cx = M;
      ['Naziv artikla', 'Kategorija', 'Kol.'].forEach((h, i) => {
        if (i === 2) pdf.text(h, cx + cols[i] - 2, y + 4.8, { align: 'right' });
        else         pdf.text(h, cx + 2, y + 4.8);
        cx += cols[i];
      });
      y += ROW_H;

      // Redovi
      pdf.setFont('helvetica', 'normal');
      for (const item of items.value) {
        cx = M;
        [item.item_name, item.category_name, String(item.quantity)].forEach((cell, i) => {
          pdf.rect(cx, y, cols[i], ROW_H, 'S');
          const txt = (pdf.splitTextToSize(cell, cols[i] - 4)[0]) || '';
          if (i === 2) pdf.text(txt, cx + cols[i] - 2, y + 4.8, { align: 'right' });
          else         pdf.text(txt, cx + 2, y + 4.8);
          cx += cols[i];
        });
        y += ROW_H;
      }
      y += 8;
    }

    // ── Ukupni iznos ──
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(0);
    pdf.text(
      `Ukupna nabava se procjenjuje na iznos od ${formatCurrency(request.value.total_amount)}.`,
      M, y
    );
    y += 14;

    // ── Status + datum ──
    pdf.setLineWidth(0.4);
    pdf.line(M, y, PW - M, y);
    y += 5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.text(`Status: ${request.value.status_name}`, M, y);
    pdf.text(`Ispisano: ${todayDate.value}`, PW - M, y, { align: 'right' });

    pdf.save(`${request.value.request_number}.pdf`);
  } finally {
    pdfGenerating.value = false;
  }
};

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
const formatDateOnly = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('hr-HR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
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
  min-height: 100vh;
  padding: 32px 40px 72px;
  background: transparent;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  color: #111827;
}

.page-shell {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  padding: 0;
  font-family: inherit;
  font-size: 0.8125rem;
  color: #4b5563;
  cursor: pointer;
  transition: color 0.15s;
  width: fit-content;
}
.back-link:hover { color: #0067b8; text-decoration: underline; }

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
  gap: 24px;
  flex-wrap: wrap;
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}
.page-header__main { flex: 1; min-width: 240px; }
.page-header__eyebrow {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0067b8;
  margin-bottom: 8px;
}
.page-header__title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.page-header__title {
  font-size: 2.1rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.015em;
  line-height: 1.2;
  margin: 0;
}
.page-header__meta {
  font-size: 0.875rem;
  color: #4b5563;
  margin-top: 8px;
}
.page-header__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 34px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  border-radius: 3px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
  white-space: nowrap;
  color: #111827;
  background: white;
}
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary {
  background: #111827;
  color: white;
  border-color: #111827;
}
.btn--primary:hover:not(:disabled) { background: #000; border-color: #000; }
.btn--ghost {
  background: white;
  color: #374151;
  border-color: #d1d5db;
}
.btn--ghost:hover:not(:disabled) { background: #f9fafb; border-color: #6b7280; }
.pdf-locked {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  background: white;
  color: #9ca3af;
  font: inherit;
  font-size: 0.8125rem;
  cursor: default;
  user-select: none;
}
.btn--danger {
  background: white;
  color: #c50f1f;
  border-color: #d1d5db;
}
.btn--danger:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #c50f1f;
}
.btn--warning {
  background: white;
  color: #B7791F;
  border-color: #d1d5db;
}
.btn--warning:hover:not(:disabled) {
  background: #fff8e1;
  border-color: #B7791F;
}

.icon-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.icon-btn:hover { background: #f3f4f6; color: #111827; }
.icon-btn--danger:hover { background: #fef2f2; color: #c50f1f; }

/* Status badges */
.status {
  display: inline-flex;
  align-items: center;
  min-height: 20px;
  padding: 2px 8px;
  border-radius: 3px;
  background: #f3f4f6;
  color: #374151;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  white-space: nowrap;
}
.status--sent     { color: #1d4ed8; background: #dbeafe; }
.status--review   { color: #92400e; background: #fef3c7; }
.status--returned { color: #9a3412; background: #ffedd5; }
.status--rejected { color: #991b1b; background: #fee2e2; }
.status--ordered  { color: #065f46; background: #d1fae5; }
.status--closed   { color: #166534; background: #dcfce7; }
.status--default  { color: #374151; background: #f3f4f6; }

/* Action banners */
.action-banner {
  background: white;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #0067b8;
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}
.action-banner--neutral { border-left-color: #0067b8; }
.action-banner--warning { border-left-color: #B7791F; background: #fffdf7; }
.action-banner--info    { border-left-color: #0078d4; background: #f8fbff; }
.action-banner--success { border-left-color: #107C10; background: #fbfffb; }

.action-banner__icon {
  width: 34px;
  height: 34px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #0067b8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.action-banner--warning .action-banner__icon { background: #fff8e1; border-color: #fde68a; color: #B7791F; }
.action-banner--info .action-banner__icon { background: #eff6ff; border-color: #bfdbfe; color: #0078d4; }
.action-banner--success .action-banner__icon { background: #f0fdf4; border-color: #bbf7d0; color: #107C10; }

.action-banner__body { flex: 1; min-width: 220px; }
.action-banner__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 2px;
}
.action-banner__desc {
  font-size: 0.8125rem;
  color: #4b5563;
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
  border: 1px solid #fde68a;
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
  color: #111827;
  line-height: 1.5;
  white-space: pre-wrap;
}

/* Cards */
.card {
  background: white;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}
.card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.card__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}
.card__title .q-icon { color: #0067b8; }
.card__count {
  font-size: 0.75rem;
  font-weight: 500;
  color: #6b7280;
}
.card__body { padding: 18px; }
.card__body--flush { padding: 0; }
.card__empty {
  padding: 32px 16px;
  text-align: center;
  font-size: 0.8125rem;
  color: #6b7280;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
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
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 0.8125rem;
}
.info-row:last-child { border-bottom: none; }
.info-row dt { color: #6b7280; margin: 0; }
.info-row dd { color: #111827; font-weight: 500; margin: 0; text-align: right; }
.info-row__amount { font-variant-numeric: tabular-nums; }

.prose {
  font-size: 0.875rem;
  color: #111827;
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
  color: #6b7280;
  background: #fafafa;
  padding: 10px 18px;
  border-bottom: 1px solid #e5e7eb;
}
.items-table tbody td {
  padding: 12px 18px;
  font-size: 0.8125rem;
  color: #111827;
  border-bottom: 1px solid #f0f0f0;
}
.items-table tbody tr:last-child td { border-bottom: none; }
.text-right { text-align: right; }
.muted { color: #6b7280; }
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
  padding: 0;
  height: 22px;
  font-size: 0.75rem;
  font-weight: 500;
  background: transparent;
  color: #6b7280;
}
.doc-indicator--ok {
  color: #107C10;
}

.file-list { list-style: none; padding: 0; margin: 0; }
.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.12s;
}
.file-row:hover { background: #f9fafb; }
.file-row:last-child { border-bottom: none; }

.file-icon {
  width: 32px;
  height: 32px;
  border: 1px solid #e5e7eb;
  background: #fafafa;
  color: #0067b8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.file-info { flex: 1; min-width: 0; }
.file-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.file-meta {
  font-size: 0.6875rem;
  color: #6b7280;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.doc-tag {
  display: inline-block;
  padding: 1px 6px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.doc-tag--offer    { background: #eff6ff; color: #2563eb; }
.doc-tag--delivery { background: #f0fdf4; color: #107C10; }
.file-actions { display: flex; gap: 2px; }

/* Upload */
.upload-section {
  padding: 16px 18px;
  background: #fafafa;
  border-top: 1px solid #e5e7eb;
}
.upload-section__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
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
  height: 34px;
  border-radius: 0;
  background: white;
}
.upload-field :deep(.q-field__native),
.upload-field :deep(.q-field__input) { font-size: 0.8125rem; }

.upload-fixed-type {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: white;
  border: 1px solid #d1d5db;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #111827;
  white-space: nowrap;
  height: 34px;
}
.upload-btn { height: 34px; }
.upload-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 8px;
}

/* Timeline */
.timeline {
  list-style: none;
  margin: 0;
  padding: 14px 18px;
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
  background: #e5e7eb;
}
.timeline-item:last-child::before { display: none; }

.timeline-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: white;
  border: 1px solid #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  color: #6b7280;
  margin-top: 2px;
}
.timeline-item--doc-add .timeline-dot { background: #f0fdf4; border-color: #bbf7d0; color: #107C10; }
.timeline-item--doc-del .timeline-dot { background: #fef2f2; border-color: #fecaca; color: #c50f1f; }
.timeline-item--edit .timeline-dot { background: #eff6ff; border-color: #bfdbfe; color: #0078d4; }
.timeline-item--s-1 .timeline-dot { background: #eff6ff; border-color: #bfdbfe; color: #2563eb; }
.timeline-item--s-2 .timeline-dot { background: #fff8e1; border-color: #fde68a; color: #B7791F; }
.timeline-item--s-3 .timeline-dot { background: #fff7ed; border-color: #fed7aa; color: #C2410C; }
.timeline-item--s-5 .timeline-dot { background: #fef2f2; border-color: #fecaca; color: #c50f1f; }
.timeline-item--s-6 .timeline-dot { background: #eff6ff; border-color: #bfdbfe; color: #0078d4; }
.timeline-item--s-7 .timeline-dot { background: #f0fdf4; border-color: #bbf7d0; color: #107C10; }

.timeline-content { flex: 1; min-width: 0; padding-top: 2px; }
.timeline-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #111827;
}
.timeline-meta {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 1px;
}
.timeline-comment {
  margin-top: 6px;
  padding: 8px 12px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  font-size: 0.8125rem;
  color: #111827;
  line-height: 1.5;
}

/* Empty */
.empty-block--page {
  text-align: center;
  padding: 56px 24px;
  background: white;
  border: 1px solid #e5e7eb;
}
.empty-block__icon { color: #9ca3af; margin-bottom: 8px; }
.empty-block__text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
}

/* Dialog */
.dialog-card {
  min-width: 460px;
  max-width: 90vw;
  overflow: hidden;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 6.4px 14.4px rgba(0, 0, 0, 0.13),
    0 1.2px 3.6px rgba(0, 0, 0, 0.10);
}
.dialog-header { padding: 18px 20px 10px; }
.dialog-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
  letter-spacing: -0.005em;
}
.dialog-desc {
  font-size: 0.8125rem;
  color: #4b5563;
  margin-top: 3px;
}
.dialog-body { padding: 0 20px 14px; }
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e7eb;
  background: #fafafa;
}

@media (max-width: 600px) {
  .page { padding: 24px 16px 56px; }
  .page-header__title { font-size: 1.7rem; }
  .action-banner { flex-direction: column; align-items: stretch; }
  .action-banner__actions { width: 100%; }
  .action-banner__actions .btn { flex: 1; }
  .dialog-card { min-width: 0; width: 100%; }
}

/* ════════════════════════════════════════════════════
   PRINT VIEW — skriven na ekranu, vidljiv pri ispisu
   ════════════════════════════════════════════════════ */
.print-view {
  display: none;
}

@media print {
  /* Reset stranice */
  @page {
    size: A4;
    margin: 18mm;
  }

  body {
    background: white !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Sve s klasom no-print sakrij */
  .no-print { display: none !important; }

  /* Sakrij Quasar header/footer ako postoji */
  .q-layout, .q-page-container, .q-page {
    background: white !important;
  }

  .page,
  .q-page {
    background: white !important;
    padding: 0 !important;
    min-height: 0 !important;
    height: auto !important;
  }

  /* Spriječi prazan page break */
  .page-shell,
  .print-view {
    page-break-after: avoid;
    break-after: avoid;
  }

  .print-stamp {
    page-break-after: avoid;
    break-after: avoid;
  }

  .page-shell {
    max-width: 100% !important;
    gap: 0 !important;
  }

  /* PRINT VIEW — vidljiv */
  .print-view {
    display: block !important;
    color: black;
    font-family: 'Times New Roman', Times, serif;
    font-size: 11pt;
    line-height: 1.4;
  }

  /* ─────── Zaglavlje institucije ─────── */
  .print-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    margin-bottom: 4px;
  }

  .print-header__left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .print-header__logo {
    width: 48px;
    height: 48px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .print-header__inst {
    font-size: 11pt;
    font-weight: 700;
    color: #1F3864;
    letter-spacing: 0.04em;
  }

  .print-header__right {
    text-align: right;
    font-size: 8pt;
    color: #1F3864;
    font-weight: 700;
    letter-spacing: 0.02em;
  }
  .print-header__right-en {
    font-style: italic;
    font-weight: 400;
    margin-top: 0;
  }

  .print-header__contact {
    font-size: 8pt;
    color: #555;
    text-align: center;
    margin-top: 6px;
  }

  .print-header__line {
    border-top: 1.5px solid black;
    margin: 8px 0 22px;
  }

  /* ─────── Naslov u okviru ─────── */
  .print-title-box {
    border: 1px solid black;
    padding: 4px 0;          /* ← bilo 12px, sad je 6px */
    text-align: center;
    margin-bottom: 20px;     /* opcionalno: smanji margin ispod */
  }
  .print-title-box h1 {
    font-size: 12pt;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin: 0;
  }

  /* ─────── Polja ─────── */
  .print-fields {
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: 14px 16px;
    margin-bottom: 24px;
  }

  .print-fields__label {
    font-size: 11pt;
    color: black;
  }
  .print-fields__label-sub {
    font-style: italic;
    font-size: 10pt;
    color: black;
    display: block;
  }
  .print-fields__value {
    font-size: 11pt;
    color: black;
  }

  /* ─────── Svrha ─────── */
  .print-purpose {
    margin-bottom: 18px;
  }
  .print-purpose__box {
    border: 1px solid black;
    padding: 10px 12px;
    min-height: 130px;
  }
  .print-purpose__label {
    font-size: 11pt;
    margin-bottom: 6px;
  }
  .print-purpose__text {
    font-size: 11pt;
    line-height: 1.55;
    white-space: pre-wrap;
  }

  /* ─────── Stavke (mala tablica) ─────── */
  .print-items {
    margin: 16px 0 22px;
  }
  .print-items__title {
    font-size: 10pt;
    font-style: italic;
    color: #555;
    margin-bottom: 4px;
  }
  .print-items table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10pt;
  }
  .print-items th, .print-items td {
    border: 1px solid black;
    padding: 4px 8px;
    text-align: left;
  }
  .print-items th {
    font-weight: 700;
    background: #F0F0F0;
  }
  .print-items .num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* ─────── Ukupni iznos ─────── */
  .print-total {
    font-size: 11pt;
    margin: 18px 0 8px;
  }

  /* ─────── Status stamp ─────── */
  .print-stamp {
    margin-top: 28px;
    padding-top: 12px;
    border-top: 1px solid black;
    display: flex;
    justify-content: space-between;
    font-size: 9pt;
    color: black;
  }
}
</style>
