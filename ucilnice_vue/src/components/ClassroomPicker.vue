<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useClassroomStore } from '../stores/classroom';
import { computed, ref } from 'vue';

const classroomStore = useClassroomStore();

const { classrooms } = storeToRefs(classroomStore);

const filteredClassrooms = computed(() => {
  const query = searchQuery.value.toLowerCase();

  return classrooms.value
    .filter(
      (classroom) =>
        classroom.name.toLowerCase().includes(query) ||
        classroom.slug?.toLowerCase().includes(query),
    )
    .map((e) => ({ ...e, sortName: (e.slug ?? e.name).replace(/^PR?/g, '') }))
    .sort((a, b) => a.sortName.localeCompare(b.sortName));
});

function selectClassroom(classroomSlug: string) {
  window.location.href = `?room=${classroomSlug}`;
}

const searchQuery = ref('');
</script>

<template>
  <div class="classroom-picker">
    <input type="text" v-model="searchQuery" placeholder="Išči..." autofocus />
    <div class="grid">
      <button
        v-for="classroom in filteredClassrooms"
        :key="classroom.id"
        class="classroom-card"
        @click="selectClassroom(classroom.slug ?? '')"
      >
        <h2>{{ classroom.slug }}</h2>
        <p>{{ classroom.name }}</p>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/base.scss';

.classroom-picker {
  height: 100%;
  display: flex;
  flex-direction: column;
}

input {
  padding: 1rem;
  font-size: 2rem;
  border: none;
  border-bottom: 0.2rem solid $gray-light;
  margin-bottom: 2rem;
  outline: none;
  background: transparent;
  color: $black;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 1rem;
  padding: 0;
  margin: 0;
  height: 100%;
  overflow: auto;
}

.classroom-card {
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  font-size: 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: $black;
  background-color: $gray-lightest;
  border: none;
  text-align: left;

  &:hover {
    background-color: $primary;
    color: $white;
  }

  h2 {
    font-size: 3rem;
    font-weight: 700;
    margin-right: 1rem;
  }
}
</style>
