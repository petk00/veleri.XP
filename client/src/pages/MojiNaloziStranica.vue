<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h4">Moji nalozi</div>

      <q-btn
        color="primary"
        icon="add"
        label="Novi nalog"
        to="/novi-nalog"
      />
    </div>

    <q-card>
      <q-card-section>
        <q-table
          title="Popis naloga"
          :rows="nalozi"
          :columns="columns"
          row-key="id"
          flat
          bordered
        >
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge
                :color="dohvatiBojuStatusa(props.row.status)"
                text-color="white"
                :label="props.row.status"
              />
            </q-td>
          </template>

          <template #body-cell-akcije="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                dense
                icon="visibility"
                color="primary"
                :to="`/detalji-naloga/${props.row.id}`"
              />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
const columns = [
  {
    name: 'broj',
    label: 'Broj naloga',
    field: 'broj',
    align: 'left'
  },
  {
    name: 'predmet',
    label: 'Predmet nabave',
    field: 'predmet',
    align: 'left'
  },
  {
    name: 'mjestoTroska',
    label: 'Mjesto troška',
    field: 'mjestoTroska',
    align: 'left'
  },
  {
    name: 'status',
    label: 'Status',
    field: 'status',
    align: 'left'
  },
  {
    name: 'datum',
    label: 'Datum kreiranja',
    field: 'datum',
    align: 'left'
  },
  {
    name: 'akcije',
    label: 'Akcije',
    field: 'akcije',
    align: 'center'
  }
]

const nalozi = [
  {
    id: 1,
    broj: 'NAL-2026-001',
    predmet: 'Uredski materijal',
    mjestoTroska: 'Računovodstvo',
    status: 'Nacrt',
    datum: '05.04.2026.'
  },
  {
    id: 2,
    broj: 'NAL-2026-002',
    predmet: 'IT oprema',
    mjestoTroska: 'IT odjel',
    status: 'Poslan',
    datum: '06.04.2026.'
  },
  {
    id: 3,
    broj: 'NAL-2026-003',
    predmet: 'Namještaj',
    mjestoTroska: 'Uprava',
    status: 'U obradi',
    datum: '07.04.2026.'
  }
]

const dohvatiBojuStatusa = (status) => {
  if (status === 'Nacrt') return 'grey'
  if (status === 'Poslan') return 'primary'
  if (status === 'U obradi') return 'orange'
  if (status === 'Zatvoren') return 'positive'
  return 'dark'
}
</script>