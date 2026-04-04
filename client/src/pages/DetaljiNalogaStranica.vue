<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h4">Detalji naloga</div>
        <div class="text-subtitle1 text-grey-7">
          {{ nalog.broj }}
        </div>
      </div>

      <div class="row q-gutter-sm">
        <q-btn
          color="primary"
          icon="visibility"
          label="Preview"
        />
        <q-btn
          color="secondary"
          icon="arrow_back"
          label="Natrag"
          to="/moji-nalozi"
        />
      </div>
    </div>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Broj naloga</div>
            <div class="text-body1">{{ nalog.broj }}</div>
          </div>

          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Status</div>
            <q-badge
              :color="dohvatiBojuStatusa(nalog.status)"
              text-color="white"
              :label="nalog.status"
            />
          </div>

          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Poslovna godina</div>
            <div class="text-body1">{{ nalog.poslovnaGodina }}</div>
          </div>

          <div class="col-12 col-md-3">
            <div class="text-caption text-grey-7">Ukupan iznos</div>
            <div class="text-body1">{{ nalog.ukupanIznos }}</div>
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Predmet nabave</div>
            <div class="text-body1">{{ nalog.predmetNabave }}</div>
          </div>

          <div class="col-12 col-md-6">
            <div class="text-caption text-grey-7">Mjesto troška</div>
            <div class="text-body1">{{ nalog.mjestoTroska }}</div>
          </div>

          <div class="col-12">
            <div class="text-caption text-grey-7">Napomena</div>
            <div class="text-body1">{{ nalog.napomena }}</div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="left"
      >
        <q-tab name="stavke" label="Stavke" />
        <q-tab name="dokumenti" label="Dokumenti" />
        <q-tab name="povijest" label="Povijest" />
      </q-tabs>

      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="stavke">
          <q-table
            :rows="nalog.stavke"
            :columns="columnsStavke"
            row-key="id"
            flat
            bordered
          />
        </q-tab-panel>

        <q-tab-panel name="dokumenti">
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h6">Priloženi dokumenti</div>

            <q-btn
              color="primary"
              icon="upload_file"
              label="Dodaj dokument"
            />
          </div>

          <q-table
            :rows="nalog.dokumenti"
            :columns="columnsDokumenti"
            row-key="id"
            flat
            bordered
          />
        </q-tab-panel>

        <q-tab-panel name="povijest">
          <q-timeline color="primary">
            <q-timeline-entry
              v-for="radnja in nalog.povijest"
              :key="radnja.id"
              :title="radnja.naslov"
              :subtitle="radnja.datum"
            >
              <div>{{ radnja.opis }}</div>
            </q-timeline-entry>
          </q-timeline>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const tab = ref('stavke')

const columnsStavke = [
  { name: 'redniBroj', label: 'Rbr.', field: 'redniBroj', align: 'left' },
  { name: 'naziv', label: 'Naziv stavke', field: 'naziv', align: 'left' },
  { name: 'kolicina', label: 'Količina', field: 'kolicina', align: 'left' }
]

const columnsDokumenti = [
  { name: 'vrsta', label: 'Vrsta dokumenta', field: 'vrsta', align: 'left' },
  { name: 'naziv', label: 'Naziv datoteke', field: 'naziv', align: 'left' },
  { name: 'datum', label: 'Datum dodavanja', field: 'datum', align: 'left' }
]

const testniNalozi = {
  1: {
    id: 1,
    broj: 'NAL-2026-001',
    status: 'Nacrt',
    poslovnaGodina: '2026',
    predmetNabave: 'Uredski materijal',
    mjestoTroska: 'Računovodstvo',
    ukupanIznos: '250,00 EUR',
    napomena: 'Potreban uredski materijal za drugi kvartal.',
    stavke: [
      { id: 1, redniBroj: 1, naziv: 'Papir A4', kolicina: 10 },
      { id: 2, redniBroj: 2, naziv: 'Kemijske olovke', kolicina: 20 }
    ],
    dokumenti: [
      { id: 1, vrsta: 'Ponuda', naziv: 'ponuda-office.pdf', datum: '08.04.2026.' }
    ],
    povijest: [
      { id: 1, naslov: 'Nalog kreiran', datum: '08.04.2026.', opis: 'Korisnik je kreirao nalog.' },
      { id: 2, naslov: 'Spremljen kao nacrt', datum: '08.04.2026.', opis: 'Nalog je spremljen u statusu nacrt.' }
    ]
  },
  2: {
    id: 2,
    broj: 'NAL-2026-002',
    status: 'Poslan',
    poslovnaGodina: '2026',
    predmetNabave: 'IT oprema',
    mjestoTroska: 'IT odjel',
    ukupanIznos: '1.200,00 EUR',
    napomena: 'Nabava nove mrežne opreme.',
    stavke: [
      { id: 1, redniBroj: 1, naziv: 'Router', kolicina: 2 },
      { id: 2, redniBroj: 2, naziv: 'Switch', kolicina: 1 }
    ],
    dokumenti: [
      { id: 1, vrsta: 'Ponuda', naziv: 'it-ponuda.pdf', datum: '07.04.2026.' },
      { id: 2, vrsta: 'Otpremnica', naziv: 'otpremnica.pdf', datum: '09.04.2026.' }
    ],
    povijest: [
      { id: 1, naslov: 'Nalog kreiran', datum: '07.04.2026.', opis: 'Korisnik je kreirao nalog.' },
      { id: 2, naslov: 'Nalog poslan', datum: '07.04.2026.', opis: 'Nalog je poslan na obradu.' }
    ]
  },
  3: {
    id: 3,
    broj: 'NAL-2026-003',
    status: 'U obradi',
    poslovnaGodina: '2026',
    predmetNabave: 'Namještaj',
    mjestoTroska: 'Uprava',
    ukupanIznos: '800,00 EUR',
    napomena: 'Uredska stolica i stol.',
    stavke: [
      { id: 1, redniBroj: 1, naziv: 'Uredska stolica', kolicina: 2 },
      { id: 2, redniBroj: 2, naziv: 'Radni stol', kolicina: 1 }
    ],
    dokumenti: [],
    povijest: [
      { id: 1, naslov: 'Nalog kreiran', datum: '06.04.2026.', opis: 'Korisnik je kreirao nalog.' },
      { id: 2, naslov: 'Status promijenjen', datum: '08.04.2026.', opis: 'Nalog je prebačen u obradu.' }
    ]
  }
}

const nalog = testniNalozi[route.params.id]

const dohvatiBojuStatusa = (status) => {
  if (status === 'Nacrt') return 'grey'
  if (status === 'Poslan') return 'primary'
  if (status === 'U obradi') return 'orange'
  if (status === 'Zatvoren') return 'positive'
  return 'dark'
}
</script>