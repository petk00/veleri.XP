<template>
  <q-page class="page">
    <div class="page-shell">

      <!-- Page header -->
      <header class="page-header">
        <div class="page-header__main">
          <nav class="breadcrumb" aria-label="Breadcrumb">
            <span class="breadcrumb__item">Nabava</span>
            <span class="breadcrumb__sep">›</span>
            <button class="breadcrumb__back" type="button" @click="$router.push(isAdmin ? '/zahtjevi' : '/dashboard')">{{ isAdmin ? 'Zahtjevi' : 'Moji zahtjevi' }}</button>
            <span class="breadcrumb__sep">›</span>
            <button class="breadcrumb__back" type="button" @click="goBack">{{ requestNumber || '...' }}</button>
            <span class="breadcrumb__sep">›</span>
            <span class="breadcrumb__current">Uređivanje</span>
          </nav>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="loading-block">
        <q-spinner color="primary" size="32px" />
      </div>

      <div v-else-if="form" class="content-shell">

        <!-- ───── Card: Basic data ───── -->
        <div class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="info" size="16px" />
              <span>Osnovni podaci</span>
            </h2>
          </div>
          <div class="card__body">
            <div class="field field--half">
              <label class="field__label">Odjel / Služba / Projekt *</label>
              <q-select
                v-model="form.fk_department"
                :options="departmentOptions"
                outlined dense
                emit-value map-options
                placeholder="Odaberite..."
                class="field__input"
              >
                <template #prepend>
                  <q-icon name="business" size="16px" />
                </template>
              </q-select>
            </div>

            <div class="field">
              <label class="field__label">Obrazloženje nabave *</label>
              <q-input
                v-model="form.justification"
                type="textarea"
                outlined autogrow rows="4"
                counter maxlength="1000"
                placeholder="Opišite zašto se ova nabava vrši i čemu služi..."
                class="field__input field__input--textarea"
              />
            </div>

            <div class="field">
              <label class="field__label">Napomena podnositelja</label>
              <q-input
                v-model="form.comment"
                type="textarea"
                outlined autogrow rows="3"
                counter maxlength="500"
                placeholder="Opcionalna napomena uz zahtjev..."
                class="field__input field__input--textarea"
              />
              <div class="field__hint">Neobavezno. Vidljivo svim sudionicima u obradi.</div>
            </div>

            <div class="field-grid">
              <div class="field">
                <label class="field__label">Procijenjeni iznos</label>
                <q-input
                  v-model.number="form.estimated_amount"
                  type="number" min="0" step="0.01"
                  outlined dense
                  placeholder="0,00"
                  suffix="EUR"
                  class="field__input"
                />
                <div class="field__hint">Neobavezno. Ostavite prazno ako nije poznato.</div>
              </div>
              <div /> <!-- prazna kolona za poravnanje -->
            </div>
          </div>
        </div>

        <!-- ───── Card: Ponuda pregled (samo za "imam ponudu" tok) ───── -->
        <div v-if="hasPonuda" class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="folder" size="16px" />
              <span>Priložena ponuda</span>
            </h2>
          </div>
          <div class="card__body card__body--flush">
            <ul class="ponuda-list">
              <li v-for="att in ponudaAttachments" :key="att.id_attachment" class="ponuda-row">
                <div class="ponuda-icon">
                  <q-icon :name="fileIcon(att.file_type)" size="18px" />
                </div>
                <div class="ponuda-info">
                  <div class="ponuda-name">{{ att.file_name }}</div>
                  <div class="ponuda-meta">{{ att.uploaded_by }} · {{ new Date(att.uploaded_at).toLocaleDateString('hr-HR') }}</div>
                </div>
                <div class="ponuda-actions">
                  <button v-if="canPreview(att)" class="icon-btn" @click="previewAttachment(att)">
                    <q-icon name="visibility" size="16px" />
                    <q-tooltip>Prikaži</q-tooltip>
                  </button>
                  <button class="icon-btn" @click="downloadAttachment(att)">
                    <q-icon name="download" size="16px" />
                    <q-tooltip>Preuzmi</q-tooltip>
                  </button>
                  <button class="icon-btn icon-btn--danger" @click="deleteAttachment(att)">
                    <q-icon name="delete_outline" size="16px" />
                    <q-tooltip>Obriši</q-tooltip>
                  </button>
                </div>
              </li>
            </ul>
            <div class="ponuda-hint">
              <q-icon name="info_outline" size="14px" />
              Pregledajte ponudu i upišite procijenjeni iznos u polje iznad.
            </div>
          </div>
        </div>

        <!-- ───── Card: Upload ponude (prikazuje se kad nema Ponude) ───── -->
        <div v-if="!hasPonuda" class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="upload_file" size="16px" />
              <span>Dodaj ponudu</span>
            </h2>
          </div>
          <div class="card__body">
            <label class="upload-zone">
              <q-icon :name="uploadFilePonuda ? 'insert_drive_file' : 'upload_file'" size="26px" class="upload-zone__icon" />
              <span class="upload-zone__text">{{ uploadFilePonuda ? uploadFilePonuda.name : 'Klikni ili povuci datoteku ovdje' }}</span>
              <span v-if="!uploadFilePonuda" class="upload-zone__hint">PDF, DOCX, XLSX, slike, ZIP — najviše 10 MB</span>
              <q-file v-model="uploadFilePonuda" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip" style="display: none" />
            </label>
            <div class="upload-actions">
              <button v-if="uploadFilePonuda" class="btn btn--ghost" type="button" @click="uploadFilePonuda = null">
                <q-icon name="close" size="14px" /><span>Ukloni</span>
              </button>
              <button class="btn btn--primary" :disabled="!uploadFilePonuda || uploading" @click="uploadPonuda">
                <q-spinner v-if="uploading" size="14px" color="white" />
                <q-icon v-else name="upload" size="16px" />
                <span>Učitaj ponudu</span>
              </button>
            </div>
            <div v-if="uploadErrorPonuda" class="upload-error">{{ uploadErrorPonuda }}</div>
          </div>
        </div>

        <!-- ───── Card: Priložena otpremnica ───── -->
        <div v-if="hasOtpremnica" class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="local_shipping" size="16px" />
              <span>Priložena otpremnica</span>
            </h2>
          </div>
          <div class="card__body card__body--flush">
            <ul class="ponuda-list">
              <li v-for="att in otpremnicaAttachments" :key="att.id_attachment" class="ponuda-row">
                <div class="ponuda-icon">
                  <q-icon :name="fileIcon(att.file_type)" size="18px" />
                </div>
                <div class="ponuda-info">
                  <div class="ponuda-name">{{ att.file_name }}</div>
                  <div class="ponuda-meta">{{ att.uploaded_by }} · {{ new Date(att.uploaded_at).toLocaleDateString('hr-HR') }}</div>
                </div>
                <div class="ponuda-actions">
                  <button v-if="canPreview(att)" class="icon-btn" @click="previewAttachment(att)">
                    <q-icon name="visibility" size="16px" />
                    <q-tooltip>Prikaži</q-tooltip>
                  </button>
                  <button class="icon-btn" @click="downloadAttachment(att)">
                    <q-icon name="download" size="16px" />
                    <q-tooltip>Preuzmi</q-tooltip>
                  </button>
                  <button class="icon-btn icon-btn--danger" @click="deleteAttachment(att)">
                    <q-icon name="delete_outline" size="16px" />
                    <q-tooltip>Obriši</q-tooltip>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <!-- ───── Card: Upload otpremnice (prikazuje se kad nema Otpremnice) ───── -->
        <div v-if="!hasOtpremnica" class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="upload_file" size="16px" />
              <span>Dodaj otpremnicu</span>
            </h2>
          </div>
          <div class="card__body">
            <label class="upload-zone">
              <q-icon :name="uploadFileOtpremnica ? 'insert_drive_file' : 'upload_file'" size="26px" class="upload-zone__icon" />
              <span class="upload-zone__text">{{ uploadFileOtpremnica ? uploadFileOtpremnica.name : 'Klikni ili povuci datoteku ovdje' }}</span>
              <span v-if="!uploadFileOtpremnica" class="upload-zone__hint">PDF, DOCX, XLSX, slike, ZIP — najviše 10 MB</span>
              <q-file v-model="uploadFileOtpremnica" accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,.zip" style="display: none" />
            </label>
            <div class="upload-actions">
              <button v-if="uploadFileOtpremnica" class="btn btn--ghost" type="button" @click="uploadFileOtpremnica = null">
                <q-icon name="close" size="14px" /><span>Ukloni</span>
              </button>
              <button class="btn btn--primary" :disabled="!uploadFileOtpremnica || uploading" @click="uploadOtpremnica">
                <q-spinner v-if="uploading" size="14px" color="white" />
                <q-icon v-else name="upload" size="16px" />
                <span>Učitaj otpremnicu</span>
              </button>
            </div>
            <div v-if="uploadErrorOtpremnica" class="upload-error">{{ uploadErrorOtpremnica }}</div>
          </div>
        </div>

        <!-- ───── Card: Items (samo za "nemam ponudu" tok) ───── -->
        <div v-if="!hasPonuda" class="card">
          <div class="card__header">
            <h2 class="card__title">
              <q-icon name="inventory_2" size="16px" />
              <span>Stavke zahtjeva</span>
            </h2>
            <span v-if="form.items.length > 0" class="card__count">
              {{ form.items.length }}
            </span>
          </div>

          <div class="card__body">
            <!-- Add item form -->
            <div class="add-item">
              <div class="add-item__label">Dodaj stavku</div>
              <div class="add-item__field-labels">
                <span>Kategorija</span>
                <span>Naziv artikla / usluge</span>
                <span>Količina</span>
              </div>
              <div class="add-item__row">
                <q-select
                  v-model="itemForm.category"
                  :options="categoryOptions"
                  placeholder="Odaberi..."
                  outlined dense
                  emit-value map-options
                  class="add-item__category"
                />
                <q-input
                  v-model="itemForm.item_name"
                  placeholder="Unesite naziv..."
                  outlined dense
                  class="add-item__name"
                  @keyup.enter="addItem"
                />
                <q-input
                  v-model.number="itemForm.quantity"
                  placeholder="1"
                  type="number" min="1"
                  outlined dense
                  class="add-item__qty"
                />
                <button class="btn btn--primary add-item__btn" @click="addItem">
                  <q-icon name="add" size="16px" />
                  <span>Dodaj</span>
                </button>
              </div>
            </div>

            <!-- List -->
            <div v-if="form.items.length === 0" class="empty-block">
              <q-icon name="inventory_2" size="24px" class="empty-block__icon" />
              <div class="empty-block__text">Nema dodanih stavki.</div>
              <div class="empty-block__hint">Zahtjev mora sadržavati barem jednu stavku.</div>
            </div>

            <ul v-else class="item-list">
              <li v-for="(item, index) in form.items" :key="index" class="item-list__row">
                <div class="item-list__index">{{ index + 1 }}</div>
                <div class="item-list__content">
                  <div class="item-list__name">{{ item.item_name }}</div>
                  <div class="item-list__category">{{ item.category_label }}</div>
                </div>
                <div class="item-list__qty">× {{ item.quantity }}</div>
                <button class="icon-btn icon-btn--danger" @click="removeItem(index)">
                  <q-icon name="delete_outline" size="16px" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        <!-- ───── Action bar ───── -->
        <div class="action-bar">
          <button class="btn btn--ghost" :disabled="saving" @click="goBack">
            Odustani
          </button>
          <button class="btn btn--cta" :disabled="saving" @click="saveChanges">
            <q-spinner v-if="saving" size="16px" color="white" />
            <q-icon v-else name="save" size="16px" />
            <span>{{ saving ? 'Spremam...' : 'Spremi izmjene' }}</span>
          </button>
        </div>

      </div>

      <!-- Error -->
      <div v-else class="empty-block empty-block--page">
        <q-icon name="error_outline" size="32px" class="empty-block__icon" />
        <div class="empty-block__text">Zahtjev nije pronađen.</div>
        <div class="empty-block__hint">Provjerite poveznicu ili se vratite na popis zahtjeva.</div>
      </div>

    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { api } from 'boot/axios';
import { getStoredUser } from 'src/utils/authStorage';

const route = useRoute();
const router = useRouter();
const $q = useQuasar();

const loading = ref(false);
const saving = ref(false);
const submitted = ref(false);
const originalForm = ref(null);
const requestNumber = ref('');
const isAdmin = getStoredUser()?.role_name === 'Administrator';
const fiscalYear = ref('');
const attachments = ref([]);
const uploading = ref(false);
const uploadFilePonuda = ref(null);
const uploadFileOtpremnica = ref(null);
const uploadErrorPonuda = ref(null);
const uploadErrorOtpremnica = ref(null);

watch(uploadFilePonuda, () => { uploadErrorPonuda.value = null; });
watch(uploadFileOtpremnica, () => { uploadErrorOtpremnica.value = null; });

const serializeItems = (items) =>
  JSON.stringify(items.map((i) => ({
    c: i.fk_item_category,
    n: i.item_name,
    q: Number(i.quantity),
  })));

const isDirty = computed(() => {
  if (submitted.value || !form.value || !originalForm.value) return false;
  const f = form.value;
  const o = originalForm.value;
  return (
    f.fk_department !== o.fk_department ||
    f.justification.trim() !== o.justification.trim() ||
    (f.comment ?? '').trim() !== (o.comment ?? '').trim() ||
    String(f.estimated_amount ?? '') !== String(o.estimated_amount ?? '') ||
    serializeItems(f.items) !== o.itemsJson
  );
});

const handleBeforeUnload = (e) => {
  if (isDirty.value) { e.preventDefault(); e.returnValue = ''; }
};
onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload));
onUnmounted(() => window.removeEventListener('beforeunload', handleBeforeUnload));

onBeforeRouteLeave(() => {
  if (!isDirty.value) return true;
  return new Promise((resolve) => {
    $q.dialog({
      title: 'Napuštanje stranice',
      message: 'Imate nespremljene izmjene. Jeste li sigurni da želite napustiti stranicu?',
      cancel: { label: 'Ostani', flat: true, color: 'primary' },
      ok: { label: 'Napusti', color: 'negative', flat: true },
      persistent: true,
    }).onOk(() => resolve(true)).onCancel(() => resolve(false));
  });
});

const hasPonuda = computed(() =>
  attachments.value.some((a) => a.document_type === 'Ponuda')
);
const hasOtpremnica = computed(() =>
  attachments.value.some((a) => a.document_type === 'Otpremnica')
);

const ponudaAttachments = computed(() =>
  attachments.value.filter((a) => a.document_type === 'Ponuda')
);
const otpremnicaAttachments = computed(() =>
  attachments.value.filter((a) => a.document_type === 'Otpremnica')
);

const refreshAttachments = async () => {
  const res = await api.get(`/requests/${route.params.id}/attachments`);
  attachments.value = Array.isArray(res.data) ? res.data : [];
};

const uploadDoc = async (file, docType, clearFn, errorRef) => {
  if (!file) return;
  errorRef.value = null;
  uploading.value = true;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('document_type', docType);
  try {
    await api.post(`/requests/${route.params.id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    $q.notify({ type: 'positive', message: `${docType} uspješno dodana.` });
    clearFn();
    await refreshAttachments();
  } catch (error) {
    errorRef.value = error.response?.data?.message || 'Greška pri učitavanju datoteke. Pokušajte ponovno.';
  } finally {
    uploading.value = false;
  }
};

const uploadPonuda = () => uploadDoc(uploadFilePonuda.value, 'Ponuda', () => { uploadFilePonuda.value = null; }, uploadErrorPonuda);
const uploadOtpremnica = () => uploadDoc(uploadFileOtpremnica.value, 'Otpremnica', () => { uploadFileOtpremnica.value = null; }, uploadErrorOtpremnica);

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
      await refreshAttachments();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.response?.data?.message || 'Greška pri brisanju.',
      });
    }
  });
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

const fileIcon = (mimeType) => {
  if (!mimeType) return 'insert_drive_file';
  if (mimeType.includes('pdf')) return 'picture_as_pdf';
  if (mimeType.includes('image')) return 'image';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'description';
  if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'table_chart';
  return 'insert_drive_file';
};

const departmentOptions = ref([]);
const categoryOptions = ref([]);

const form = ref(null);

const itemForm = ref({ category: null, item_name: '', quantity: 1 });

const fetchData = async () => {
  loading.value = true;
  try {
    const [detailsRes, departmentsRes, categoriesRes, attachmentsRes] = await Promise.all([
      api.get(`/requests/${route.params.id}`),
      api.get('/reference/departments'),
      api.get('/reference/item-categories'),
      api.get(`/requests/${route.params.id}/attachments`),
    ]);

    const request = detailsRes.data.request;
    const items = detailsRes.data.items;
    attachments.value = Array.isArray(attachmentsRes.data) ? attachmentsRes.data : [];

    requestNumber.value = request.request_number;
    fiscalYear.value = String(request.fiscal_year || '');

    departmentOptions.value = departmentsRes.data.map((d) => ({
      label: d.name,
      value: d.id_department,
    }));

    categoryOptions.value = categoriesRes.data.map((c) => ({
      label: c.name,
      value: c.id_item_category,
    }));

    // Referentne rute vraćaju samo aktivne odjele/kategorije — ako je
    // odjel ili kategorija zahtjeva u međuvremenu deaktivirana, dodaj je
    // u opcije da uređivanje ne prikaže prazan select (backend dopušta
    // ponovno slanje s postojećom vrijednošću).
    if (request.fk_department
        && !departmentOptions.value.some((d) => d.value === request.fk_department)) {
      departmentOptions.value.push({
        label: `${request.department_name} (neaktivan)`,
        value: request.fk_department,
      });
    }
    for (const it of items) {
      if (it.fk_item_category
          && !categoryOptions.value.some((c) => c.value === it.fk_item_category)) {
        categoryOptions.value.push({
          label: `${it.category_name} (neaktivna)`,
          value: it.fk_item_category,
        });
      }
    }

    form.value = {
      fk_department: request.fk_department || null,
      justification: request.justification || '',
      comment: request.comment || '',
      estimated_amount: request.total_amount || null,
      items: items.map((it) => ({
        fk_item_category:
          it.fk_item_category
          || categoryOptions.value.find((c) => c.label === it.category_name)?.value
          || null,
        category_label: it.category_name,
        item_name: it.item_name,
        quantity: it.quantity,
      })),
    };
    originalForm.value = {
      fk_department: form.value.fk_department,
      justification: form.value.justification,
      comment: form.value.comment,
      estimated_amount: form.value.estimated_amount,
      itemsJson: serializeItems(form.value.items),
    };
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Greška pri učitavanju zahtjeva.';

    if (status === 403 || status === 404) {
      $q.notify({ type: 'negative', message });
      router.replace(`/zahtjevi/${route.params.id}`);
      return;
    }

    console.error('Greška pri dohvaćanju:', error);
    $q.notify({ type: 'negative', message });
    form.value = null;
  } finally {
    loading.value = false;
  }
};

const addItem = () => {
  if (
    !itemForm.value.category
    || !itemForm.value.item_name.trim()
    || !itemForm.value.quantity
    || itemForm.value.quantity < 1
  ) {
    $q.notify({ type: 'negative', message: 'Ispunite kategoriju, naziv i količinu.' });
    return;
  }
  const category = categoryOptions.value.find((x) => x.value === itemForm.value.category);
  form.value.items.push({
    fk_item_category: itemForm.value.category,
    category_label: category?.label || '',
    item_name: itemForm.value.item_name.trim(),
    quantity: itemForm.value.quantity,
  });
  itemForm.value = { category: null, item_name: '', quantity: 1 };
};

const removeItem = (index) => form.value.items.splice(index, 1);

const saveChanges = async () => {
  if (!form.value.fk_department) {
    $q.notify({ type: 'negative', message: 'Odjel je obavezan.' });
    return;
  }
  if (!form.value.justification.trim()) {
    $q.notify({ type: 'negative', message: 'Obrazloženje je obavezno.' });
    return;
  }
  if (form.value.justification.length > 1000) {
    $q.notify({ type: 'negative', message: 'Obrazloženje ne smije biti duže od 1000 znakova.' });
    return;
  }
  if (form.value.estimated_amount != null && form.value.estimated_amount < 0) {
    $q.notify({ type: 'negative', message: 'Procijenjeni iznos mora biti pozitivan.' });
    return;
  }
  if (form.value.items.length === 0) {
    $q.notify({ type: 'negative', message: 'Zahtjev mora imati barem jednu stavku.' });
    return;
  }

  saving.value = true;

  const payload = {
    fk_department: form.value.fk_department,
    justification: form.value.justification.trim(),
    comment: form.value.comment?.trim() || null,
    estimated_amount: form.value.estimated_amount || null,
    items: form.value.items.map((it) => ({
      fk_item_category: it.fk_item_category,
      item_name: it.item_name,
      quantity: it.quantity,
    })),
  };

  try {
    await api.put(`/requests/${route.params.id}`, payload);
    $q.notify({ type: 'positive', message: 'Zahtjev uspješno ažuriran.' });
    submitted.value = true;
    router.push(`/zahtjevi/${route.params.id}`);
  } catch (error) {
    console.error('Greška pri spremanju:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Greška pri spremanju.',
    });
  } finally {
    saving.value = false;
  }
};

const goBack = () => router.push(`/zahtjevi/${route.params.id}`);
// Odustani na formi: router guard (onBeforeRouteLeave) intercepts navigation
// i prikazuje dijalog za potvrdu ako isDirty — ne treba duplikat ovdje.

onMounted(() => fetchData());
</script>

<style scoped>
/* ─── Page shell — ograničena širina, identično s RequestDetailsPage ─── */
.page {
  padding: 0;
  background: transparent;
  color: #111827;
  font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.page-shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 24px 40px 100px; /* bottom padding da sticky action-bar ne prekriva sadržaj */
}

/* ─── Page header ─── */
.page-header {
  margin-bottom: 20px;
}

.page-meta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 0.6875rem;
  color: #9ca3af;
  font-weight: 500;
}

/* ─── Content shell ─── */
.content-shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ─── Card overrides — isti pattern kao section-header u RequestDetailsPage ─── */
.card__header {
  padding: 10px 14px;
  background: transparent;
}

.card__title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #16294e;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.card__title .q-icon { color: #16294e; }

/* count-pill identično s RequestDetailsPage */
.card__count {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 20px; height: 20px; padding: 0 6px;
  border-radius: 9999px;
  background: rgba(0, 175, 219, 0.12);
  color: #0e7490;
  font-size: 0.6875rem; font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.card__body { padding: 14px 18px; }
.card__body--flush { padding: 0; }

/* ─── Polja ─── */
.field {
  margin-bottom: 12px;
}
.field:last-child { margin-bottom: 0; }

/* Labele polja — podređene section naslovima, isti stil kao info-cell dt u RequestDetailsPage */
.field__label {
  display: block;
  margin-bottom: 5px;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.field__hint {
  margin-top: 5px;
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.4;
}

/* Odjel zauzima ~50% širine — uravnoteženije od pune širine za kratki select */
.field--half { max-width: 50%; }

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

/* ─── Input styling ─── */
.field__input :deep(.q-field__control) {
  height: 40px;
  border-radius: 10px !important;
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field__input :deep(.q-field--outlined .q-field__control::before),
.field__input :deep(.q-field__control::before) {
  border-color: #e5e7eb;
  border-radius: 10px;
}
.field__input :deep(.q-field--outlined.q-field--focused .q-field__control::after) {
  border-color: #00afdb;
  border-width: 1.5px;
  border-radius: 10px;
  box-shadow: 0 0 0 3px rgba(0,175,219,0.1);
}
.field__input :deep(.q-field__native) {
  color: #111827;
  font-size: 0.875rem;
}
.field__input :deep(.q-field__prepend),
.field__input :deep(.q-field__suffix) {
  color: #9ca3af;
  font-size: 0.75rem;
}
.field__input--readonly :deep(.q-field__control) { background: #fafafa; }
.field__input--readonly :deep(.q-field__native)  { color: #6b7280; }
.field__input--textarea :deep(.q-field__control) {
  height: auto;
  min-height: 88px;
  padding-top: 6px;
  padding-bottom: 6px;
}
.field__input--textarea :deep(textarea) {
  color: #111827;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* ─── Dokument redovi — identični s doc-slot u RequestDetailsPage ─── */
.ponuda-list { list-style: none; margin: 0; padding: 0; }

.ponuda-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 18px;
  border-bottom: 1px solid #f0f0f0;
}
.ponuda-row:last-child { border-bottom: none; }

.ponuda-icon {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: #00afdb;
  background: rgba(0,175,219,0.07);
  border: 1px solid rgba(0,175,219,0.2);
  border-radius: 6px;
}
.ponuda-info { flex: 1; min-width: 0; }
.ponuda-name {
  font-size: 0.8125rem; font-weight: 500; color: #111827;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ponuda-meta { font-size: 0.6875rem; color: #6b7280; margin-top: 1px; }
.ponuda-actions { display: flex; gap: 2px; flex-shrink: 0; }

.ponuda-hint {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px;
  font-size: 0.75rem; color: #0e7490;
  background: #f0fbfe;
  border-top: 1px solid #e0f6fd;
}

/* ─── Upload zona ─── */
.upload-zone {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; padding: 18px 16px;
  border: 2px dashed rgba(0,175,219,0.35);
  border-radius: 10px;
  background: #fafafa;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  text-align: center;
  margin-bottom: 10px;
}
.upload-zone:hover { border-color: #00afdb; background: #f0fbfe; }
.upload-zone__icon { color: rgba(0,175,219,0.45); transition: color 0.15s; }
.upload-zone:hover .upload-zone__icon { color: #00afdb; }
.upload-zone__text { font-size: 0.875rem; font-weight: 500; color: #374151; word-break: break-all; }
.upload-zone__hint { font-size: 0.75rem; color: #9ca3af; }

.upload-actions { display: flex; gap: 8px; justify-content: flex-end; }
.upload-error { font-size: 0.8125rem; color: #dc2626; margin-top: 6px; }

/* ─── Dodaj stavku ─── */
.add-item {
  margin-bottom: 12px;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
}

.add-item__label {
  margin-bottom: 8px;
  color: #6b7280;
  font-size: 0.6875rem; font-weight: 600;
  letter-spacing: 0.04em; text-transform: uppercase;
}

.add-item__field-labels {
  display: grid;
  grid-template-columns: 1fr 1.4fr 80px;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 0.6875rem; font-weight: 600;
  color: #9ca3af;
  letter-spacing: 0.02em; text-transform: uppercase;
}

.add-item__row {
  display: grid;
  grid-template-columns: 1fr 1.4fr 80px auto;
  gap: 8px;
  align-items: stretch;
}

.add-item__category :deep(.q-field__control),
.add-item__name     :deep(.q-field__control),
.add-item__qty      :deep(.q-field__control) {
  height: 36px;
  border-radius: 8px !important;
  background: #fff;
}
.add-item__category :deep(.q-field__native),
.add-item__name     :deep(.q-field__native),
.add-item__qty      :deep(.q-field__native) {
  color: #111827;
  font-size: 0.8125rem;
}
.add-item__btn { height: 36px; border-radius: 8px !important; }

/* ─── Lista stavki ─── */
.item-list {
  list-style: none; margin: 0; padding: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.item-list__row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 14px;
  border-bottom: 1px solid #f0f0f0;
}
.item-list__row:last-child { border-bottom: none; }

.item-list__index {
  display: flex; width: 22px; height: 22px;
  align-items: center; justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  background: rgba(0,175,219,0.1);
  color: #0e7490;
  font-size: 0.6875rem; font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.item-list__content { flex: 1; min-width: 0; }
.item-list__name     { color: #111827; font-size: 0.8125rem; font-weight: 500; }
.item-list__category { margin-top: 1px; color: #6b7280; font-size: 0.75rem; }
.item-list__qty {
  flex-shrink: 0;
  color: #0e7490; font-size: 0.75rem; font-weight: 600;
  font-variant-numeric: tabular-nums;
  background: rgba(0,175,219,0.08);
  padding: 2px 8px; border-radius: 20px;
}

/* ─── Empty state ─── */
.empty-block {
  padding: 28px 16px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  text-align: center;
}
.empty-block--page { padding: 56px 24px; border-style: solid; background: #fff; }
.empty-block__icon { margin-bottom: 6px; color: #9ca3af; }
.empty-block__text { color: #374151; font-size: 0.8125rem; font-weight: 500; }
.empty-block__hint { margin-top: 4px; color: #6b7280; font-size: 0.75rem; }

/* ─── Sticky action bar ─── */
.action-bar {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-top: 1px solid #e5e7eb;
  margin-top: 20px;
}

/* ─── Responsive ─── */
@media (max-width: 700px) {
  .field-grid { grid-template-columns: 1fr; }
  .field--half { max-width: 100%; }
  .add-item__row { grid-template-columns: 1fr 1fr; }
  .add-item__field-labels { grid-template-columns: 1fr 1fr; }
  .add-item__btn { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .page-shell { padding: 16px 16px 100px; }
  .action-bar { flex-direction: column-reverse; }
  .action-bar .btn { width: 100%; }
}
</style>
