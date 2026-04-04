<template>
  <q-page class="q-pa-md">
    <div class="text-h4 q-mb-md">Novi nalog</div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-h6 q-mb-md">Osnovni podaci</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <q-select
              v-model="forma.poslovnaGodina"
              :options="poslovneGodine"
              label="Poslovna godina"
              outlined
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="forma.predmetNabave"
              :options="predmetiNabave"
              label="Predmet nabave"
              outlined
            />
          </div>

          <div class="col-12 col-md-4">
            <q-select
              v-model="forma.mjestoTroska"
              :options="mjestaTroska"
              label="Mjesto troška"
              outlined
            />
          </div>

          <div class="col-12 col-md-6">
            <q-input
              v-model="forma.ukupanIznos"
              label="Ukupan iznos"
              type="number"
              outlined
            />
          </div>

          <div class="col-12">
            <q-input
              v-model="forma.napomena"
              label="Napomena"
              type="textarea"
              outlined
              autogrow
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md">
          <div class="text-h6">Stavke naloga</div>

          <q-btn
            color="primary"
            icon="add"
            label="Dodaj stavku"
            @click="dodajStavku"
          />
        </div>

        <div
          v-for="(stavka, index) in forma.stavke"
          :key="stavka.id"
          class="row q-col-gutter-md q-mb-md"
        >
          <div class="col-12 col-md-1">
            <q-input
              :model-value="index + 1"
              label="Rbr."
              outlined
              readonly
            />
          </div>

          <div class="col-12 col-md-7">
            <q-input
              v-model="stavka.naziv"
              label="Naziv stavke"
              outlined
            />
          </div>

          <div class="col-12 col-md-2">
            <q-input
              v-model="stavka.kolicina"
              label="Količina"
              type="number"
              outlined
            />
          </div>

          <div class="col-12 col-md-2 flex flex-center">
            <q-btn
              color="negative"
              icon="delete"
              flat
              round
              @click="obrisiStavku(index)"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <div class="row q-gutter-sm">
      <q-btn
        color="secondary"
        label="Spremi kao nacrt"
        @click="spremiKaoNacrt"
      />
      <q-btn
        color="primary"
        label="Pošalji nalog"
        @click="posaljiNalog"
      />
    </div>

    <q-banner
      v-if="poruka"
      class="bg-green-1 text-positive q-mt-md"
      rounded
    >
      {{ poruka }}
    </q-banner>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'

const poruka = ref('')

const poslovneGodine = ['2025', '2026']
const predmetiNabave = [
  'Uredski materijal',
  'IT oprema',
  'Namještaj'
]
const mjestaTroska = [
  'Računovodstvo',
  'IT odjel',
  'Uprava'
]

const forma = ref({
  poslovnaGodina: '',
  predmetNabave: '',
  mjestoTroska: '',
  ukupanIznos: '',
  napomena: '',
  stavke: [
    { id: 1, naziv: '', kolicina: 1 }
  ]
})

const dodajStavku = () => {
  forma.value.stavke.push({
    id: Date.now(),
    naziv: '',
    kolicina: 1
  })
}

const obrisiStavku = (index) => {
  if (forma.value.stavke.length === 1) return
  forma.value.stavke.splice(index, 1)
}

const spremiKaoNacrt = () => {
  console.log('Nalog spremljen kao nacrt:', forma.value)
  poruka.value = 'Nalog je spremljen kao nacrt.'
}

const posaljiNalog = () => {
  console.log('Nalog poslan:', forma.value)
  poruka.value = 'Nalog je uspješno poslan.'
}
</script>