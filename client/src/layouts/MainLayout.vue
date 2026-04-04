<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          @click="lijeviDrawerOtvoren = !lijeviDrawerOtvoren"
        />

        <q-toolbar-title>
          Sustav za naloge nabave
        </q-toolbar-title>

        <div class="q-mr-md">Igor Petković</div>

        <q-btn
          flat
          dense
          icon="logout"
          label="Odjava"
          to="/prijava"
        />
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="lijeviDrawerOtvoren"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          Navigacija
        </q-item-label>

        <q-item clickable v-ripple to="/moji-nalozi">
          <q-item-section avatar>
            <q-icon name="list_alt" />
          </q-item-section>
          <q-item-section>
            Moji nalozi
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple to="/novi-nalog">
          <q-item-section avatar>
            <q-icon name="add_circle" />
          </q-item-section>
          <q-item-section>
            Novi nalog
          </q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container class="bg-grey-2">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'

const lijeviDrawerOtvoren = ref(true)
</script>