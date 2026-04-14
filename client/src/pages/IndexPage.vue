<template>
  <q-page padding>
    <div class="text-h4 q-mb-lg">Dashboard</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-4">
        <q-card clickable class="cursor-pointer" @click="$router.push('/requests')">
          <q-card-section>
            <div class="text-h6">Zahtjevi za nabavu</div>
            <div class="text-body2">Pregled svih zahtjeva</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>